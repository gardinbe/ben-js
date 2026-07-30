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

export const Swap = (
  item: (() => Component | null) | Reactive<Component | null>,
): Component => {
  const member = typeof item === 'function' ? derived(item) : item

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

    if (member.value) {
      add(member.value)
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

    setChildComponentsConnected(getMemberComponents(member.value))

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

    setChildComponentsDisconnected(getMemberComponents(member.value))

    if (__DEV__) {
      recordComponentEvent(c, ComponentLifecycleEvent.DISCONNECTED)
    }

    runHooks(disconnectedHooks)
    isMounted = false
  }

  const unmount = () => {
    member.value?.unmount()
    marker.remove()
  }

  const destroy = () => {
    member.value?.destroy()
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

  watch(member, (next, previous) => {
    if (!next || next === previous) {
      return
    }

    previous?.destroy()
    add(next)
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
    registerComponent(c, ComponentKind.SWAP, () =>
      getMemberComponents(member.value),
    )
  }

  return c
}

const getMemberComponents = (component: Component | null): Array<Component> =>
  component ? [component] : []
