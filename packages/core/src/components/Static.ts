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
  type ComponentDevState,
  type ComponentHookFunction,
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
  let fragment: DocumentFragment | null = null

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
    fragment = null
    unmount()
    setDisconnected()
    nodes = null
    logEvent(LogEventType.DESTROYED, dev)
  }

  const render = () => {
    const previousContent = content
    const previousFragment = fragment
    const nextContent = createContent(parts)
    const nextFragment = createFragment(nextContent)

    content = nextContent
    fragment = nextFragment
    nodes = patch({
      content: nextContent,
      currentNodes: nodes,
      dev,
      marker,
      nextFragment,
      previousContent,
      previousFragment,
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

type PatchOptions = {
  content: ComponentContent
  currentNodes: Array<ChildNode> | null
  dev: ComponentDevState | null
  marker: Comment
  nextFragment: DocumentFragment
  previousContent: ComponentContent | null
  previousFragment: DocumentFragment | null
  render: () => void
}

const patch = ({
  content,
  currentNodes,
  dev,
  marker,
  nextFragment,
  previousContent,
  previousFragment,
  render,
}: PatchOptions): Array<ChildNode> => {
  const replace = (): Array<ChildNode> => {
    const frag = materializeFragment(cloneNode(nextFragment), content, dev)
    const nextNodes = [...frag.childNodes]

    currentNodes?.forEach(node => {
      node.remove()
    })

    marker.parentNode?.insertBefore(frag, marker)
    return nextNodes
  }

  const syncContent = () => {
    withDifference(previousContent?.reactives, content.reactives, rx => {
      unsubscribe(rx, render)
    })

    withDifference(previousContent?.refs, content.refs, ref => {
      ref.set(null)
    })

    withDifference(
      previousContent?.components,
      content.components,
      component => {
        component.destroy()
      },
    )

    withDifference(content.reactives, previousContent?.reactives, rx => {
      subscribe(rx, render)
    })
  }

  if (
    !previousFragment ||
    !currentNodes ||
    // Child components expand one marker into a range of nodes, so keep that
    // path conservative until component ranges have explicit boundaries.
    hasComponentMarkers(previousFragment) ||
    hasComponentMarkers(nextFragment)
  ) {
    syncContent()
    return replace()
  }

  syncContent()
  patchChildren({
    currentNodes,
    marker,
    nextNodes: [...nextFragment.childNodes],
    previousNodes: [...previousFragment.childNodes],
  })

  syncRefs(nextFragment, currentNodes, content.refs, dev)
  return currentNodes
}

const createFragment = (content: ComponentContent): DocumentFragment => {
  const tpl = document.createElement('template')
  tpl.innerHTML = content.html
  return tpl.content
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

type PatchChildrenOptions = {
  currentNodes: Array<ChildNode>
  nextNodes: Array<ChildNode>
  previousNodes: Array<ChildNode>
  marker?: Comment
  parent?: Node
}

const patchChildren = ({
  currentNodes,
  marker,
  nextNodes,
  parent,
  previousNodes,
}: PatchChildrenOptions) => {
  const getParent = (): Node | null =>
    parent ?? currentNodes[0]?.parentNode ?? marker?.parentNode ?? null

  let index = 0

  while (
    index < previousNodes.length ||
    index < nextNodes.length ||
    index < currentNodes.length
  ) {
    const currentNode = currentNodes[index]
    const nextNode = nextNodes[index]
    const previousNode = previousNodes[index]

    if (!nextNode) {
      currentNode?.remove()
      currentNodes.splice(index, 1)
      previousNodes.splice(index, 1)
      continue
    }

    if (!currentNode || !previousNode) {
      const node = cloneNode(nextNode)
      getParent()?.insertBefore(node, currentNode ?? marker ?? null)
      currentNodes.splice(index, 0, node)
      index += 1
      continue
    }

    if (!canPatchNode(previousNode, nextNode, currentNode)) {
      const node = cloneNode(nextNode)
      currentNode.replaceWith(node)
      currentNodes[index] = node
      index += 1
      continue
    }

    patchNode(currentNode, previousNode, nextNode)
    index += 1
  }
}

const patchNode = (
  currentNode: ChildNode,
  previousNode: ChildNode,
  nextNode: ChildNode,
) => {
  if (isTextNode(currentNode) && isTextNode(nextNode)) {
    if (currentNode.data !== nextNode.data) {
      currentNode.data = nextNode.data
    }

    return
  }

  if (isCommentNode(currentNode) && isCommentNode(nextNode)) {
    if (currentNode.data !== nextNode.data) {
      currentNode.data = nextNode.data
    }

    return
  }

  if (
    isElementNode(currentNode) &&
    isElementNode(previousNode) &&
    isElementNode(nextNode)
  ) {
    patchAttributes(currentNode, nextNode)
    patchChildren({
      currentNodes: [...currentNode.childNodes],
      nextNodes: [...nextNode.childNodes],
      parent: currentNode,
      previousNodes: [...previousNode.childNodes],
    })
  }
}

const patchAttributes = (current: Element, next: Element) => {
  const nextAttributes = new Map(
    [...next.attributes].map(attr => [attr.name, attr.value]),
  )

  ;[...current.attributes].forEach(attr => {
    if (!nextAttributes.has(attr.name)) {
      current.removeAttribute(attr.name)
    }
  })

  nextAttributes.forEach((value, name) => {
    if (current.getAttribute(name) !== value) {
      current.setAttribute(name, value)
    }
  })
}

const canPatchNode = (
  previousNode: ChildNode,
  nextNode: ChildNode,
  currentNode: ChildNode,
): boolean => {
  if (
    previousNode.nodeType !== nextNode.nodeType ||
    currentNode.nodeType !== nextNode.nodeType
  ) {
    return false
  }

  if (!isElementNode(previousNode)) {
    return true
  }

  return (
    isElementNode(nextNode) &&
    isElementNode(currentNode) &&
    previousNode.tagName === nextNode.tagName &&
    currentNode.tagName === nextNode.tagName
  )
}

const syncRefs = (
  fragment: DocumentFragment,
  currentNodes: Array<ChildNode>,
  refs: Set<Ref>,
  dev: ComponentDevState | null,
) => {
  const refsById = new Map<string, Ref>([...refs].map(ref => [ref.uuid, ref]))

  const sync = (templateNode: ChildNode, currentNode: ChildNode) => {
    if (isElementNode(templateNode)) {
      const uuid = templateNode.getAttribute('ref')

      if (uuid) {
        const ref = refsById.get(uuid)

        if (!ref || !isHTMLElement(currentNode)) {
          throw createError(ErrorType.MISSING_REF_TARGET, dev)
        }

        currentNode.removeAttribute('ref')
        ref.set(currentNode)
      }
    }

    const templateChildren = [...templateNode.childNodes]
    const currentChildren = [...currentNode.childNodes]

    templateChildren.forEach((child, i) => {
      const currentChild = currentChildren[i]

      if (currentChild) {
        sync(child, currentChild)
      }
    })
  }

  ;[...fragment.childNodes].forEach((node, i) => {
    const currentNode = currentNodes[i]

    if (currentNode) {
      sync(node, currentNode)
    }
  })
}

const hasComponentMarkers = (fragment: DocumentFragment): boolean =>
  getMarkers(fragment, COMPONENT_CHILD_MARKER).length > 0

const cloneNode = <T extends Node>(node: T): T =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  node.cloneNode(true) as T

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
