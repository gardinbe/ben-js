import { derived, type Reactive, watch } from '@ben-js/reactivity'

import {
  type Component,
  COMPONENT_MEMBER_MARKER,
  COMPONENT_MEMBERS_MARKER,
  type ComponentHookFunction,
  ComponentMarkerSymbol,
  type ComponentMountTarget,
  ComponentSymbol,
  type ComponentUsePayload,
  getMountNode,
  isInDocument,
  runHooks,
  setChildComponentsConnected,
  setChildComponentsDisconnected,
} from '../component'
import {
  ComponentKind,
  ComponentLifecycleEvent,
  recordComponentEvent,
  registerComponent,
} from '../development'

export const List = (
  items: (() => Array<KeyedComponent>) | Reactive<Array<KeyedComponent>>,
): Component => {
  const members = typeof items === 'function' ? derived(items) : items
  const components = () => members.value.map(({ component }) => component)

  const marker = document.createComment(COMPONENT_MEMBERS_MARKER)
  let isMounted = false

  const connectedHooks = new Set<ComponentHookFunction>()
  const disconnectedHooks = new Set<ComponentHookFunction>()

  const add = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node)
    target.replaceWith(marker)

    members.value.forEach(({ component }) => add(component))

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

    setChildComponentsConnected(components())

    if (__DEV__) {
      recordComponentEvent(c, ComponentLifecycleEvent.CONNECTED)
    }

    runHooks(connectedHooks)
    isMounted = true
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    setChildComponentsDisconnected(components())

    if (__DEV__) {
      recordComponentEvent(c, ComponentLifecycleEvent.DISCONNECTED)
    }

    runHooks(disconnectedHooks)
    isMounted = false
  }

  const unmount = () => {
    members.value.forEach(({ component }) => component.unmount())
    marker.remove()
  }

  const destroy = () => {
    members.value.forEach(({ component }) => component.destroy())
    marker.remove()

    if (__DEV__) {
      recordComponentEvent(c, ComponentLifecycleEvent.DESTROYED)
    }
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

  watch(members, (next, previous) => {
    previous
      .filter(
        previousItem =>
          !next.some(nextItem => nextItem.key === previousItem.key),
      )
      .forEach(({ component }) => component.destroy())

    next
      .filter(
        nextItem =>
          !previous.some(previousItem => previousItem.key === nextItem.key),
      )
      .forEach(({ component }) => add(component))
  })

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

  if (__DEV__) {
    registerComponent(c, ComponentKind.LIST, components)
  }

  return c
}

export type KeyedComponent = {
  component: Component
  key: PropertyKey
}
