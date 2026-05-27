import {
  isReactive,
  type Reactive,
  subscribe,
  unsubscribe,
} from '@ben-js/reactivity'

import {
  type Component,
  COMPONENT_CHILD_MARKER,
  COMPONENT_MARKER,
  COMPONENT_MEMBERS_MARKER,
  type ComponentDevState,
  type ComponentHookFunction,
  ComponentMarkerSymbol,
  type ComponentMountTarget,
  ComponentSymbol,
  type ComponentUsePayload,
  connectComponents,
  disconnectComponents,
  getMountNode,
  isComponent,
  isInDocument,
} from '../component'
import {
  ComponentType,
  createComponentDev,
  logEvent,
  LogEventType,
} from '../dev'
import { createError, ErrorType } from '../error'
import { isRef, type Ref } from '../ref'
import { isStatic } from '../static'

export const html = (
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Component => {
  const parts: TemplateParts = {
    strings,
    values,
  }

  let nodes: Array<ChildNode> | null = null
  let content: ComponentContent | null = null

  const marker = document.createComment(COMPONENT_MARKER)
  let isMounted = false

  const hooks = {
    connected: new Set<ComponentHookFunction>(),
    disconnected: new Set<ComponentHookFunction>(),
  }

  const dev = createComponentDev(ComponentType.STATIC, () => [
    ...(content?.components ?? []),
  ])

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, dev)
    target.replaceWith(marker)

    if (nodes) {
      nodes.forEach(node_ => {
        marker.before(node_)
      })
    } else {
      render()
    }

    if (!isInDocument(marker)) {
      setDisconnected()
      return
    }

    setConnected()
  }

  const setConnected = () => {
    if (isMounted) {
      return
    }

    connectComponents(content?.components, dev, hooks.connected)
    isMounted = true
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    disconnectComponents(content?.components, dev, hooks.disconnected)
    isMounted = false
  }

  const unmount = () => {
    if (!nodes) {
      return
    }

    nodes.forEach(node => {
      node.remove()
    })
    marker.remove()
  }

  const destroy = () => {
    content?.reactives.forEach(rx => {
      unsubscribe(rx, render)
    })
    content?.refs.forEach(ref => {
      ref.set(null)
    })
    content?.components.forEach(component => {
      component.destroy()
    })
    content = null
    unmount()
    setDisconnected()
    nodes = null
    logEvent(LogEventType.DESTROYED, dev)
  }

  const render = () => {
    const previousContent = content
    const nextContent = createContent(parts)

    // todo: restore isSameContent function for performance?

    const nextFragment = createFragment(nextContent)

    content = nextContent
    nodes = patch({
      content,
      dev,
      marker,
      nextFragment,
      nodes,
      previousContent,
      render,
    })
  }

  const hook = (payload: ComponentUsePayload) => {
    if (payload.connected) {
      hooks.connected.add(payload.connected)
    }

    if (payload.disconnected) {
      hooks.disconnected.add(payload.disconnected)
    }

    return c
  }

  const c: Component = {
    [ComponentMarkerSymbol]: marker,
    [ComponentSymbol]: true,
    destroy,
    hook,
    mount,
    setConnected,
    setDisconnected,
    unmount,
  }

  if (dev) {
    c.DEV = dev
  }

  return c
}

type ComponentContent = {
  components: Array<Component>
  html: string
  reactives: Set<Reactive>
  refs: Array<Ref>
}

type TemplateParts = {
  strings: TemplateStringsArray
  values: Array<unknown>
}

const createContent = (parts: TemplateParts): ComponentContent => {
  const components: Array<Component> = []
  const reactives = new Set<Reactive>()
  const refs: Array<Ref> = []

  const parseValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map(parseValue).join('')
    }

    if (isReactive(value)) {
      reactives.add(value)
      return parseValue(value.value)
    }

    if (isStatic(value)) {
      return parseValue(value.value)
    }

    if (isComponent(value)) {
      components.push(value)
      return `<!--${COMPONENT_CHILD_MARKER}-->`
    }

    if (isRef(value)) {
      refs.push(value)
      return value.uuid
    }

    return stringify(value)
  }

  const htmlContent = parts.strings
    .map((str, i) => str + parseValue(parts.values[i]))
    .join('')

  return {
    components,
    html: htmlContent,
    reactives,
    refs,
  }
}

const stringify = (value: unknown): string =>
  // oxlint-disable-next-line typescript/no-base-to-string typescript/restrict-template-expressions
  value != null && value !== false ? `${value}` : ''

const createFragment = (content: ComponentContent): DocumentFragment => {
  const tpl = document.createElement('template')
  tpl.innerHTML = content.html
  return tpl.content
}

const withDifference = <T>(
  target: Set<T> | undefined,
  other: Set<T> | undefined,
  fn: (item: T) => void,
) => {
  if (!target) {
    return
  }

  if (other) {
    target.difference(other).forEach(fn)
  } else {
    target.forEach(fn)
  }
}

type PatchOptions = {
  content: ComponentContent
  dev: ComponentDevState | null
  marker: Comment
  nextFragment: DocumentFragment
  nodes: Array<ChildNode> | null
  previousContent: ComponentContent | null
  render: () => void
}

const patch = ({
  content,
  dev,
  marker,
  nextFragment,
  nodes,
  previousContent,
  render,
}: PatchOptions): Array<ChildNode> => {
  if (previousContent) {
    previousContent.reactives.difference(content.reactives).forEach(rx => {
      // todo: check `rx` is still the right abbreviation
      unsubscribe(rx, render)
    })

    content.reactives.difference(previousContent.reactives).forEach(rx => {
      subscribe(rx, render)
    })

    previousContent.refs
      .filter(ref => !content.refs.includes(ref))
      .forEach(ref => {
        ref.set(null)
      })

    previousContent.components
      .filter(component => !content.components.includes(component))
      .forEach(component => {
        component.destroy()
      })
  } else {
    content.reactives.forEach(rx => {
      subscribe(rx, render)
    })
  }

  const nextNodes = [...nextFragment.childNodes]

  if (!nodes) {
    // todo: edge case where a component mounts to a top-level node

    walk(nextNodes, content.components, content.refs)
    marker.before(...nextNodes)
    return nextNodes
  }

  const parent = marker.parentNode

  // todo: think about removing this if stmt?

  if (!parent) {
    return nodes
  }

  // const currentNodes = nodes.filter(node => node.parentNode === parent)

  walkPatch(nodes, nextNodes, parent, content.components, content.refs)
  return nodes
}

const materializeFragment = (
  frag: DocumentFragment,
  content: ComponentContent,
  dev: ComponentDevState | null,
) => {
  content.refs.forEach(ref => {
    const el = frag.querySelector<HTMLElement>(`[ref='${ref.uuid}']`)

    if (!el) {
      throw createError(ErrorType.MISSING_REF_TARGET, dev)
    }

    el.removeAttribute('ref')
    ref.set(el)
  })

  const markers = getMarkers(frag, COMPONENT_CHILD_MARKER)

  if (markers.length !== content.components.size) {
    throw createError(ErrorType.COMPONENT_MARKER_MISMATCH, dev)
  }

  markers.forEach((marker, i) => {
    ;[...content.components][i]!.mount(marker)
  })
}

const walk = (
  nodes: Array<ChildNode>,
  components: Array<Component>,
  refs: Array<Ref>,
) => {
  let index = 0

  while (index < nodes.length) {
    const node = nodes[index]!

    if (isComponentMarker(node)) {
      // todo: dev errors if missing
      components.shift()?.mount(node)
      nodes.splice(index, 1)
      // do not increment index
      // COMPLETE
      continue
    }

    if (isElementNode(node)) {
      const refAttribute = node.getAttribute('ref')

      if (refAttribute) {
        node.removeAttribute('ref')
        // todo: dev errors if missing
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        refs.shift()?.set(node as HTMLElement)
      }

      walk([...node.childNodes], components, refs)
    }

    index += 1
  }
}

const walkPatch = (
  nodes: Array<ChildNode>,
  nextNodes: Array<ChildNode>,
  parent: ParentNode,
  components: Array<Component>,
  refs: Array<Ref>,
) => {
  let index = 0

  while (index < nodes.length || index < nextNodes.length) {
    const node = nodes[index]
    const nextNode = nextNodes[index]

    if (!nextNode) {
      nodes.splice(index).forEach(removedNode => removedNode.remove())
      break
    }

    if (isComponentMarker(nextNode)) {
      components.shift()?.mount(nextNode)
      nextNodes.splice(index, 1)
      // do not increment index
      // COMPLETE
      continue
    }

    if (!node) {
      // todo: really think about this one a bit more...

      const lastNode = nodes.at(-1)

      if (lastNode) {
        lastNode.after(nextNode)
      } else {
        parent.append(nextNode)
      }

      nodes.push(nextNode)

      if (isElementNode(nextNode)) {
        walkPatch([], [...nextNode.childNodes], nextNode, components, refs)
      }

      index += 1
      continue
    }

    if (isTextNode(node) && isTextNode(nextNode)) {
      if (node.data !== nextNode.data) {
        node.data = nextNode.data
      }
    } else if (isCommentNode(node) && isCommentNode(nextNode)) {
      if (node.data !== nextNode.data) {
        node.data = nextNode.data
      }
    } else if (isElementNode(node) && isElementNode(nextNode)) {
      const refAttribute = nextNode.getAttribute('ref')

      if (refAttribute) {
        nextNode.removeAttribute('ref')
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        refs.shift()?.set(nextNode as HTMLElement)
      }

      patchAttributes(node, nextNode)

      walkPatch(
        [...node.childNodes],
        [...nextNode.childNodes],
        node,
        components,
        refs,
      )
    } else {
      node.replaceWith(nextNode)
      nodes[index] = nextNode

      if (isElementNode(nextNode)) {
        const refAttribute = nextNode.getAttribute('ref')

        if (refAttribute) {
          nextNode.removeAttribute('ref')
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          refs.shift()?.set(nextNode as HTMLElement)
        }

        walkPatch([], [...nextNode.childNodes], nextNode, components, refs)
      }
    }

    index += 1
  }
}

// todo: verify consistent use of array index and .at()

const patchAttributes = (node: Element, nextNode: Element) => {
  const nextAttributes = new Map(
    [...nextNode.attributes].map(attr => [attr.name, attr.value]),
  )

  ;[...node.attributes].forEach(attr => {
    if (nextAttributes.has(attr.name)) {
      return
    }

    node.removeAttribute(attr.name)
  })

  nextAttributes.forEach((value, name) => {
    if (node.getAttribute(name) === value) {
      return
    }

    node.setAttribute(name, value)
  })
}

const canPatchNode = (node: ChildNode, nextNode: ChildNode): boolean => {
  if (node.nodeType !== nextNode.nodeType) {
    return false
  }

  if (!isElementNode(node)) {
    return true
  }

  return isElementNode(nextNode) && node.tagName === nextNode.tagName
}

const syncRefs = (
  nodes: Array<ChildNode>,
  refs: Array<Ref>,
  dev: ComponentDevState | null,
) => {
  refs.forEach(ref => {
    const node = findRefTarget(nodes, ref.uuid)

    if (!node) {
      throw createError(ErrorType.MISSING_REF_TARGET, dev)
    }

    node.removeAttribute('ref')
    ref.set(node)
  })
}

const findRefTarget = (
  nodes: Array<ChildNode>,
  uuid: string,
): HTMLElement | null => {
  for (const node of nodes) {
    if (!isElementNode(node)) {
      continue
    }

    if (node.getAttribute('ref') === uuid) {
      if (!isHTMLElement(node)) {
        return null
      }

      return node
    }

    const target = node.querySelector<HTMLElement>(`[ref='${uuid}']`)

    if (target) {
      return target
    }
  }

  return null
}

const mountComponent = (
  component: Component,
  parent: ParentNode,
  anchor: ChildNode | null = null,
): Array<ChildNode> => {
  const start = document.createComment('')
  const end = document.createComment('')
  const marker = document.createComment(COMPONENT_CHILD_MARKER)

  if (anchor) {
    anchor.before(start, marker, end)
  } else {
    parent.append(start, marker, end)
  }

  component.mount(marker)

  const nodes: Array<ChildNode> = []
  let node = start.nextSibling

  while (node && node !== end) {
    nodes.push(node)
    node = node.nextSibling
  }

  start.remove()
  end.remove()

  return nodes
}

const findComponentMarkerIndex = (
  nodes: Array<ChildNode>,
  startIndex: number,
  component: Component,
): number => {
  const marker = component[ComponentMarkerSymbol]

  if (marker) {
    const index = nodes.indexOf(marker)

    return index >= startIndex ? index : -1
  }

  for (let i = startIndex; i < nodes.length; i += 1) {
    const node = nodes[i]

    if (!node || !isComponentMarker(node)) {
      continue
    }

    return i
  }

  return -1
}

const isComponentPlaceholder = (node: Node): node is Comment =>
  isCommentNode(node) && node.data === COMPONENT_CHILD_MARKER

const isComponentMarker = (node: Node): node is Comment =>
  isCommentNode(node) &&
  (node.data === COMPONENT_MARKER || node.data === COMPONENT_MEMBERS_MARKER)

const isCommentNode = (node: Node): node is Comment =>
  node.nodeType === Node.COMMENT_NODE

const isElementNode = (node: Node): node is Element =>
  node.nodeType === Node.ELEMENT_NODE

const isHTMLElement = (node: Node): node is HTMLElement =>
  node instanceof HTMLElement

const isTextNode = (node: Node): node is Text =>
  node.nodeType === Node.TEXT_NODE

const getMarkers = (root: Node, text: string): Array<Comment> => {
  const markers: Array<Comment> = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT)

  let node: Node | null

  while ((node = walker.nextNode())) {
    if (node.textContent !== text) {
      continue
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    markers.push(node as Comment)
  }

  return markers
}
