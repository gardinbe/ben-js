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
import { isStaticValue } from '../normalize'
import { isRef, type Ref } from '../ref'

export const html = (
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Component => {
  const parts = parseParts(strings, values)

  let nodes: Array<NodeSnapshot> | null = null
  let content: Content | null = null

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
        marker.before(node_.node)
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
      node.node.remove()
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
    content = nextContent

    // todo: restore isSameContent function for performance?

    nodes = patch({
      content,
      dev,
      marker,
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

const parseParts = (
  strings: TemplateStringsArray,
  values: Array<unknown>,
): Parts => ({
  strings,
  values: values.map(value =>
    typeof value === 'function' && value.length === 0
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
    .map((str, i) => str + parseValue(parts.values[i]))
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

type PatchPayload = {
  content: Content
  dev: ComponentDevState | null
  marker: Comment
  nodes: Array<NodeSnapshot> | null
  previousContent: Content | null
  render: () => void
}

const patch = ({
  content,
  marker,
  nodes,
  previousContent,
  render,
}: PatchPayload): Array<NodeSnapshot> => {
  const components = [...content.components]
  const refs = [...content.refs]

  if (previousContent) {
    previousContent.reactives.difference(content.reactives).forEach(rx => {
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

  const nextNodes = createNodeSnapshot(...content.fragment.childNodes)

  if (!nodes) {
    walk(nextNodes, components, refs)
    marker.before(...nextNodes.map(node => node.node))
    return nextNodes
  }

  const parent = marker.parentNode!

  walkPatch(nodes, nextNodes, parent, components, refs)
  return nodes
}

type NodeSnapshot = {
  children: Array<NodeSnapshot>
  node: ChildNode
}

const createNodeSnapshot = (...nodes: Array<Node>): Array<NodeSnapshot> =>
  nodes.map(node => ({
    children: createNodeSnapshot(...node.childNodes),
    node: node as ChildNode,
  }))

const walk = (
  nodes: Array<NodeSnapshot>,
  components: Array<Component>,
  refs: Array<Ref>,
) => {
  let index = 0

  while (index < nodes.length) {
    const node = nodes[index]!

    if (isChildComponentMarker(node.node)) {
      components.shift()?.mount(node.node)
      index += 1
      continue
    }

    if (isElementNode(node.node)) {
      const refAttribute = node.node.getAttribute('ref')

      if (refAttribute) {
        node.node.removeAttribute('ref')
        refs.shift()?.set(node.node as HTMLElement)
      }

      walk(node.children, components, refs)
    }

    index += 1
  }
}

const walkPatch = (
  nodes: Array<NodeSnapshot>,
  nextNodes: Array<NodeSnapshot>,
  parent: ParentNode,
  components: Array<Component>,
  refs: Array<Ref>,
) => {
  let index = 0

  while (index < nodes.length || index < nextNodes.length) {
    const node = nodes[index]
    const nextNode = nextNodes[index]

    if (!nextNode) {
      nodes.splice(index).forEach(removedNode => {
        removedNode.node.remove()
      })
      break
    }

    if (!node) {
      const lastNode = nodes.at(-1)

      if (lastNode) {
        lastNode.node.after(nextNode.node)
      } else {
        parent.append(nextNode.node)
      }

      nodes.push(nextNode)

      if (isElementNode(nextNode.node)) {
        const refAttribute = nextNode.node.getAttribute('ref')

        if (refAttribute) {
          nextNode.node.removeAttribute('ref')
          refs.shift()?.set(nextNode.node as HTMLElement)
        }

        walk(nextNode.children, components, refs)
      }

      index += 1
      continue
    }

    if (isChildComponentMarker(nextNode.node)) {
      const component = components.shift()

      if (isChildComponentMarker(node.node)) {
        index += 1
        continue
      }

      component?.mount(nextNode.node)
      index += 1
      continue
    }

    if (isTextNode(node.node) && isTextNode(nextNode.node)) {
      if (node.node.data !== nextNode.node.data) {
        node.node.data = nextNode.node.data
      }
    } else if (isCommentNode(node.node) && isCommentNode(nextNode.node)) {
      if (node.node.data !== nextNode.node.data) {
        node.node.data = nextNode.node.data
      }
    } else if (
      node.node.nodeName === nextNode.node.nodeName &&
      isElementNode(node.node) &&
      isElementNode(nextNode.node)
    ) {
      if (nextNode.node.hasAttribute('ref')) {
        nextNode.node.removeAttribute('ref')
        refs.shift()?.set(node.node as HTMLElement)
      }

      patchAttributes(node.node, nextNode.node)

      walkPatch(node.children, nextNode.children, node.node, components, refs)
    } else {
      node.node.replaceWith(nextNode.node)
      nodes[index] = nextNode

      if (isElementNode(nextNode.node)) {
        const refAttribute = nextNode.node.getAttribute('ref')

        if (refAttribute) {
          nextNode.node.removeAttribute('ref')
          refs.shift()?.set(nextNode.node as HTMLElement)
        }

        walk(nextNode.children, components, refs)
      }
    }

    index += 1
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

const isChildComponentMarker = (node: Node): node is Comment =>
  isCommentNode(node) && node.data === COMPONENT_CHILD_MARKER

const isCommentNode = (node: Node): node is Comment =>
  node.nodeType === Node.COMMENT_NODE

const isElementNode = (node: Node): node is Element =>
  node.nodeType === Node.ELEMENT_NODE

const isTextNode = (node: Node): node is Text =>
  node.nodeType === Node.TEXT_NODE
