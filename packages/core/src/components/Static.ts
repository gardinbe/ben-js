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
  components: Set<Component>
  html: string
  reactives: Set<Reactive>
  refs: Set<Ref>
}

type TemplateParts = {
  strings: TemplateStringsArray
  values: Array<unknown>
}

const createContent = (parts: TemplateParts): ComponentContent => {
  const reactives = new Set<Reactive>()
  const components = new Set<Component>()
  const refs = new Set<Ref>()

  const parseValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map(item => parseValue(item)).join('')
    }

    if (isReactive(value)) {
      reactives.add(value)
      return parseValue(value.value)
    }

    if (isStatic(value)) {
      return parseValue(value.value)
    }

    if (isComponent(value)) {
      components.add(value)
      return `<!--${COMPONENT_CHILD_MARKER}-->`
    }

    if (isRef(value)) {
      refs.add(value)
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
  withDifference(previousContent?.reactives, content.reactives, rx => {
    unsubscribe(rx, render)
  })

  withDifference(previousContent?.refs, content.refs, ref => {
    ref.set(null)
  })

  withDifference(previousContent?.components, content.components, component => {
    component.destroy()
  })

  withDifference(content.reactives, previousContent?.reactives, rx => {
    subscribe(rx, render)
  })

  if (!nodes) {
    // todo: edge case where a component mounts to a top-level node
    const frag = materializeFragment(nextFragment, content, dev)
    const nextNodes = [...frag.childNodes]
    marker.before(frag)
    return nextNodes
  }

  const parent = marker.parentNode

  if (!parent) {
    return nodes
  }

  // const currentNodes = nodes.filter(node => node.parentNode === parent)

  patchNodes(nodes, [...nextFragment.childNodes], parent, {
    anchor: marker,
    components: [...content.components],
    previousComponents: previousContent?.components,
  })
  syncRefs(nodes, content.refs, dev)
  return nodes
}

const materializeFragment = (
  frag: DocumentFragment,
  content: ComponentContent,
  dev: ComponentDevState | null,
): DocumentFragment => {
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

  return frag
}

const patchNodes = (
  nodes: Array<ChildNode>,
  nextNodes: Array<ChildNode>,
  parent: ParentNode,
  options: PatchChildrenOptions,
) => {
  let index = 0
  let nextIndex = 0

  while (index < nodes.length || nextIndex < nextNodes.length) {
    const node = nodes[index]
    const nextNode = nextNodes[nextIndex]

    if (!nextNode) {
      node?.remove()
      nodes.splice(index, 1)
      continue
    }

    if (isComponentPlaceholder(nextNode)) {
      const component = options.components[options.componentIndex ?? 0]
      options.componentIndex = (options.componentIndex ?? 0) + 1

      if (component && options.previousComponents?.has(component)) {
        const markerIndex = findComponentMarkerIndex(nodes, index, component)

        if (markerIndex >= index) {
          index = markerIndex + 1
          nextIndex += 1
          continue
        }
      }

      const componentNodes = component
        ? mountComponent(component, parent, node ?? options.anchor)
        : [nextNode]

      if (node) {
        node.remove()
        nodes.splice(index, 1, ...componentNodes)
      } else {
        nodes.splice(index, 0, ...componentNodes)
      }

      index += componentNodes.length
      nextIndex += 1
      continue
    }

    if (!node) {
      if (options.anchor) {
        options.anchor.before(nextNode)
      } else {
        parent.append(nextNode)
      }

      mountComponentPlaceholders(nextNode, options)
      nodes.splice(index, 0, nextNode)
      index += 1
      nextIndex += 1
      continue
    }

    if (!canPatchNode(node, nextNode)) {
      node.replaceWith(nextNode)
      mountComponentPlaceholders(nextNode, options)
      nodes[index] = nextNode
      index += 1
      nextIndex += 1
      continue
    }

    patchNode(node, nextNode, options)
    index += 1
    nextIndex += 1
  }
}

// todo: verify consistent use of array index and .at()

type PatchChildrenOptions = {
  components: Array<Component>
  previousComponents: Set<Component> | undefined
  anchor?: ChildNode | null
  componentIndex?: number
}

const patchNode = (
  node: ChildNode,
  nextNode: ChildNode,
  options: PatchChildrenOptions,
) => {
  if (isTextNode(node) && isTextNode(nextNode)) {
    if (node.data !== nextNode.data) {
      node.data = nextNode.data
    }

    return
  }

  if (isCommentNode(node) && isCommentNode(nextNode)) {
    if (node.data !== nextNode.data) {
      node.data = nextNode.data
    }

    return
  }

  if (isElementNode(node) && isElementNode(nextNode)) {
    patchAttributes(node, nextNode)
    patchNodes([...node.childNodes], [...nextNode.childNodes], node, options)
  }
}

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
  refs: Set<Ref>,
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

const mountComponentPlaceholders = (
  root: ChildNode,
  options: PatchChildrenOptions,
) => {
  if (!isElementNode(root)) {
    return
  }

  getMarkers(root, COMPONENT_CHILD_MARKER).forEach(marker => {
    const component = options.components[options.componentIndex ?? 0]
    options.componentIndex = (options.componentIndex ?? 0) + 1

    component?.mount(marker)
  })
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
