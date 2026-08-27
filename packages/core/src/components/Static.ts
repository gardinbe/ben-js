import {
  derived,
  type DerivedEffect,
  isReactive,
  type Reactive,
  subscribe,
  unsubscribe,
} from '@flame/reactivity'

import { ComponentType, addComponent } from '../internal/dev/utils'
import {
  type Component,
  COMPONENT_CHILD_MARKER,
  COMPONENT_MARKER,
  createComponent,
  isComponent,
} from '../primitives/component'
import { isStaticValue } from '../primitives/props'
import { isRef, type Ref } from '../primitives/ref'

export const html = (
  strings: TemplateStringsArray,
  ...values: Array<unknown>
): Component => {
  const parts = createParts(strings, values)

  let snapshots: Array<NodeSnapshot> | null = null
  let content: Content | null = null

  const components = () => content?.components
  const marker = document.createComment(COMPONENT_MARKER)

  const render = () => {
    const previousContent = content
    const nextContent = createContent(parts)
    content = nextContent
    snapshots = diff(content, marker, snapshots, previousContent, render)
  }

  const self = createComponent({
    getChildren: components,
    marker,
    destroy: () => {
      content?.reactives.forEach(rx => unsubscribe(rx, render))
      content?.refs.forEach(ref => ref.set(null))
      components()?.forEach(component => component.destroy())
      content = null
      self.unmount()
      snapshots = null
    },
    mount: () => {
      if (snapshots) {
        snapshots.forEach(snapshot => marker.before(snapshot.node))
      } else {
        render()
      }
    },
    unmount: () => {
      if (!snapshots) {
        return
      }

      snapshots.forEach(({ node }) => node.remove())
      marker.remove()
    },
  })

  if (__DEV__) {
    addComponent(self, ComponentType.STATIC, () => [...(components() ?? [])])
  }

  return self
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
    typeof value === 'function' && value.length === 0
      ? // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        derived(value as DerivedEffect)
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

type NodeSnapshot = {
  children: Array<NodeSnapshot>
  node: ChildNode
}

const diff = (
  content: Content,
  marker: Comment,
  snapshots: Array<NodeSnapshot> | null,
  previousContent: Content | null,
  render: () => void,
): Array<NodeSnapshot> => {
  const state: WalkState = {
    componentIndex: 0,
    components: content.components,
    previousComponents: previousContent?.components ?? [],
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
  } else {
    content.reactives.forEach(rx => subscribe(rx, render))
  }

  const nextSnapshots = createSnapshots(...content.fragment.childNodes)

  if (!snapshots) {
    marker.before(...nextSnapshots.map(node => node.node))
    setSnapshots(nextSnapshots, state)
    return nextSnapshots
  }

  const parent = marker.parentNode!

  patchSnapshots(snapshots, nextSnapshots, parent, state)

  state.previousComponents
    .filter(component => !content.components.includes(component))
    .forEach(component => component.destroy())

  return snapshots
}

const createSnapshots = (...nodes: Array<Node>): Array<NodeSnapshot> =>
  nodes.map(node => ({
    children: createSnapshots(...node.childNodes),
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    node: node as ChildNode,
  }))

type WalkState = {
  componentIndex: number
  components: Array<Component>
  previousComponents: Array<Component>
  refIndex: number
  refs: Array<Ref>
}

const setSnapshots = (snapshots: Array<NodeSnapshot>, state: WalkState) => {
  for (let i = 0; i < snapshots.length; i += 1) {
    const snapshot = snapshots.at(i)!
    const node = snapshot.node
    const nodeType = node.nodeType

    if (
      nodeType === Node.COMMENT_NODE &&
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      (node as Comment).data === COMPONENT_CHILD_MARKER
    ) {
      const component = state.components.at(state.componentIndex++)

      if (component) {
        snapshot.node = component.mount(node)
      }

      continue
    }

    if (nodeType !== Node.ELEMENT_NODE) {
      continue
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const element = node as Element
    const refAttribute = element.getAttribute('ref')

    if (refAttribute) {
      element.removeAttribute('ref')
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      state.refs.at(state.refIndex++)?.set(element as HTMLElement)
    }

    if (snapshot.children.length > 0) {
      setSnapshots(snapshot.children, state)
    }
  }
}

const patchSnapshots = (
  snapshots: Array<NodeSnapshot>,
  nextSnapshots: Array<NodeSnapshot>,
  parent: ParentNode,
  state: WalkState,
) => {
  for (let i = 0; i < snapshots.length || i < nextSnapshots.length; i += 1) {
    const nextSnapshot = nextSnapshots.at(i)

    if (!nextSnapshot) {
      snapshots.forEach(({ node }) => node.remove())

      snapshots.length = i
      break
    }

    const snapshot = snapshots.at(i)
    const nextNode = nextSnapshot.node
    const nextNodeType = nextNode.nodeType

    if (!snapshot) {
      const lastSnapshot = snapshots.at(-1)

      if (lastSnapshot) {
        lastSnapshot.node.after(nextNode)
      } else {
        parent.append(nextNode)
      }

      snapshots.push(nextSnapshot)
      setSnapshots([nextSnapshot], state)
      continue
    } else {
      const node = snapshot.node

      if (
        nextNodeType === Node.COMMENT_NODE &&
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion
        (nextNode as Comment).data === COMPONENT_CHILD_MARKER
      ) {
        const componentIndex = state.componentIndex++
        const component = state.components.at(componentIndex)

        if (
          node.nodeType === Node.COMMENT_NODE &&
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          (node as Comment).data === COMPONENT_MARKER &&
          state.previousComponents.at(componentIndex) === component
        ) {
          continue
        }

        node.replaceWith(nextNode)

        if (component) {
          nextSnapshot.node = component.mount(nextNode)
        }

        snapshots[i] = nextSnapshot
        continue
      }

      const nodeType = node.nodeType

      if (nodeType === nextNodeType) {
        if (nodeType === Node.TEXT_NODE || nodeType === Node.COMMENT_NODE) {
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          const dataNode = node as Comment | Text
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
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
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          const element = node as Element
          // oxlint-disable-next-line typescript/no-unsafe-type-assertion
          const nextElement = nextNode as Element

          if (nextElement.hasAttribute('ref')) {
            nextElement.removeAttribute('ref')
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            state.refs.at(state.refIndex++)?.set(element as HTMLElement)
          }

          patchElementAttributes(element, nextElement)

          if (
            snapshot.children.length > 0 ||
            nextSnapshot.children.length > 0
          ) {
            patchSnapshots(
              snapshot.children,
              nextSnapshot.children,
              element,
              state,
            )
          }

          continue
        }
      }

      node.replaceWith(nextNode)
      snapshots[i] = nextSnapshot
    }

    setSnapshots([nextSnapshot], state)
  }
}

const patchElementAttributes = (element: Element, nextElement: Element) => {
  const nextAttributes = new Map(
    [...nextElement.attributes].map(attr => [attr.name, attr.value]),
  )

  ;[...element.attributes].forEach(attr => {
    if (nextAttributes.has(attr.name)) {
      return
    }

    element.removeAttribute(attr.name)
  })

  nextAttributes.forEach((value, name) => {
    if (element.getAttribute(name) === value) {
      return
    }

    element.setAttribute(name, value)
  })
}
