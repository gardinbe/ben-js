import {
  derived,
  type DerivedEffect,
  isReactive,
  type Reactive,
  subscribe,
  unsubscribe,
} from '@ben-js/reactivity'

import {
  type Component,
  COMPONENT_CHILD_MARKER,
  COMPONENT_MARKER,
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
import { isStaticValue } from '../normalize'
import { isRef, type Ref } from '../ref'

export const html = (
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Component => {
  const parts = createParts(strings, values)

  let nodes: Array<NodeSnapshot> | null = null
  let content: Content | null = null

  const marker = document.createComment(COMPONENT_MARKER)
  let isMounted = false

  const connectedHooks = new Set<ComponentHookFunction>()
  const disconnectedHooks = new Set<ComponentHookFunction>()

  const dev = createComponentDev(ComponentType.STATIC, () => [
    ...(content?.components ?? []),
  ])

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, dev)
    target.replaceWith(marker)

    if (nodes) {
      nodes.forEach(node_ => marker.before(node_.node))
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

    connectComponents(content?.components, dev, connectedHooks)
    isMounted = true
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    disconnectComponents(content?.components, dev, disconnectedHooks)
    isMounted = false
  }

  const unmount = () => {
    if (!nodes) {
      return
    }

    nodes.forEach(node => node.node.remove())
    marker.remove()
  }

  const destroy = () => {
    content?.reactives.forEach(rx => unsubscribe(rx, render))
    content?.refs.forEach(ref => ref.set(null))
    content?.components.forEach(component => component.destroy())
    content = null
    unmount()
    setDisconnected()
    nodes = null
    logEvent(LogEventType.DESTROYED, dev)
  }

  const render = () => {
    const previousContent = content
    const nextContent = createContent(parts)
    content = nextContent

    // todo: restore isSameContent function for performance?

    nodes = patch(content, marker, nodes, previousContent, render)
  }

  const hook = (payload: ComponentUsePayload) => {
    if (payload.connected) {
      connectedHooks.add(payload.connected)
    }

    if (payload.disconnected) {
      disconnectedHooks.add(payload.disconnected)
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

type Content = {
  components: Array<Component>
  fragment: DocumentFragment
  reactives: Set<Reactive>
  refs: Array<Ref>
}

type Parts = {
  strings: TemplateStringsArray
  values: Array<unknown>
}

const createParts = (
  strings: TemplateStringsArray,
  values: Array<unknown>,
): Parts => ({
  strings,
  values: values.map(value =>
    typeof value === 'function' && !value.length
      ? derived(value as DerivedEffect)
      : value,
  ),
})

const createContent = (parts: Parts): Content => {
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

    if (isStaticValue(value)) {
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
    .map((str, i) => str + parseValue(parts.values.at(i)))
    .join('')

  const tpl = document.createElement('template')
  tpl.innerHTML = htmlContent
  const fragment = tpl.content

  return {
    components,
    fragment,
    reactives,
    refs,
  }
}

const stringify = (value: unknown): string =>
  // oxlint-disable-next-line typescript/no-base-to-string typescript/restrict-template-expressions
  value != null && value !== false ? `${value}` : ''

const patch = (
  content: Content,
  marker: Comment,
  nodes: Array<NodeSnapshot> | null,
  previousContent: Content | null,
  render: () => void,
): Array<NodeSnapshot> => {
  const state: WalkState = {
    componentIndex: 0,
    components: content.components,
    refIndex: 0,
    refs: content.refs,
  }

  if (previousContent) {
    previousContent.reactives
      .difference(content.reactives)
      .forEach(rx => unsubscribe(rx, render))

    content.reactives
      .difference(previousContent.reactives)
      .forEach(rx => subscribe(rx, render))

    previousContent.refs
      .filter(ref => !content.refs.includes(ref))
      .forEach(ref => ref.set(null))

    previousContent.components
      .filter(component => !content.components.includes(component))
      .forEach(component => component.destroy())
  } else {
    content.reactives.forEach(rx => subscribe(rx, render))
  }

  const nextNodes = createNodeSnapshot(...content.fragment.childNodes)

  if (!nodes) {
    mountNodes(nextNodes, state)
    marker.before(...nextNodes.map(node => node.node))
    return nextNodes
  }

  const parent = marker.parentNode!

  patchNodes(nodes, nextNodes, parent, state)
  return nodes
}

type NodeSnapshot = {
  children: Array<NodeSnapshot>
  node: ChildNode
}

type WalkState = {
  componentIndex: number
  components: Array<Component>
  refIndex: number
  refs: Array<Ref>
}

const createNodeSnapshot = (...nodes: Array<Node>): Array<NodeSnapshot> =>
  nodes.map(node => ({
    children: createNodeSnapshot(...node.childNodes),
    node: node as ChildNode,
  }))

const mountNodes = (nodes: Array<NodeSnapshot>, state: WalkState) => {
  for (let i = 0; i < nodes.length; i += 1) {
    const snapshot = nodes.at(i)!
    const node = snapshot.node
    const nodeType = node.nodeType

    if (
      nodeType === Node.COMMENT_NODE &&
      (node as Comment).data === COMPONENT_CHILD_MARKER
    ) {
      state.components.at(state.componentIndex++)?.mount(node)
      continue
    }

    if (nodeType !== Node.ELEMENT_NODE) {
      continue
    }

    const element = node as Element
    const refAttribute = element.getAttribute('ref')

    if (refAttribute) {
      element.removeAttribute('ref')
      state.refs.at(state.refIndex++)?.set(element as HTMLElement)
    }

    if (snapshot.children.length) {
      mountNodes(snapshot.children, state)
    }
  }
}

const patchNodes = (
  nodes: Array<NodeSnapshot>,
  nextNodes: Array<NodeSnapshot>,
  parent: ParentNode,
  state: WalkState,
) => {
  for (let i = 0; i < nodes.length || i < nextNodes.length; i += 1) {
    const nextSnapshot = nextNodes.at(i)

    if (!nextSnapshot) {
      nodes.forEach(({ node }) => node.remove())

      nodes.length = i
      break
    }

    const snapshot = nodes.at(i)
    const nextNode = nextSnapshot.node
    const nextNodeType = nextNode.nodeType

    if (!snapshot) {
      const lastSnapshot = nodes.at(-1)

      if (lastSnapshot) {
        lastSnapshot.node.after(nextNode)
      } else {
        parent.append(nextNode)
      }

      nodes.push(nextSnapshot)
    } else {
      const node = snapshot.node

      if (
        nextNodeType === Node.COMMENT_NODE &&
        (nextNode as Comment).data === COMPONENT_CHILD_MARKER
      ) {
        const component = state.components.at(state.componentIndex++)

        if (
          node.nodeType === Node.COMMENT_NODE &&
          (node as Comment).data === COMPONENT_CHILD_MARKER
        ) {
          continue
        }

        component?.mount(nextNode)
        continue
      }

      const nodeType = node.nodeType

      if (nodeType === nextNodeType) {
        if (nodeType === Node.TEXT_NODE || nodeType === Node.COMMENT_NODE) {
          const dataNode = node as Comment | Text
          const nextData = (nextNode as Comment | Text).data

          if (dataNode.data !== nextData) {
            dataNode.data = nextData
          }

          continue
        }

        if (
          nodeType === Node.ELEMENT_NODE &&
          node.nodeName === nextNode.nodeName
        ) {
          const element = node as Element
          const nextElement = nextNode as Element

          if (nextElement.hasAttribute('ref')) {
            nextElement.removeAttribute('ref')
            state.refs.at(state.refIndex++)?.set(element as HTMLElement)
          }

          patchAttributes(element, nextElement)

          if (snapshot.children.length || nextSnapshot.children.length) {
            patchNodes(snapshot.children, nextSnapshot.children, element, state)
          }

          continue
        }
      }

      node.replaceWith(nextNode)
      nodes[i] = nextSnapshot
    }

    if (nextNodeType !== Node.ELEMENT_NODE) {
      continue
    }

    const nextElement = nextNode as Element
    const refAttribute = nextElement.getAttribute('ref')

    if (refAttribute) {
      nextElement.removeAttribute('ref')
      state.refs.at(state.refIndex++)?.set(nextElement as HTMLElement)
    }

    if (nextSnapshot.children.length) {
      mountNodes(nextSnapshot.children, state)
    }
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
