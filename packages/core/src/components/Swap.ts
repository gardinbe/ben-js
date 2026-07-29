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
  connectComponents,
  disconnectComponents,
  getMountNode,
  isInDocument,
} from '../component'
import {
  ComponentType,
  createComponentDev,
  logEvent,
  LogEventType,
} from '../dev'

export const Swap = (
  item: (() => Component | null) | Reactive<Component | null>,
): Component => {
  const member = typeof item === 'function' ? derived(item) : item

  const marker = document.createComment(COMPONENT_MEMBERS_MARKER)
  let isMounted = false

  const connectedHooks = new Set<ComponentHookFunction>()
  const disconnectedHooks = new Set<ComponentHookFunction>()

  const dev = createComponentDev(ComponentType.SWAP, () =>
    getMemberComponents(member.value),
  )

  const add = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, dev)
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

    connectComponents(getMemberComponents(member.value), dev, connectedHooks)
    isMounted = true
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    disconnectComponents(
      getMemberComponents(member.value),
      dev,
      disconnectedHooks,
    )
    isMounted = false
  }

  const unmount = () => {
    member.value?.unmount()
    marker.remove()
  }

  const destroy = () => {
    member.value?.destroy()
    marker.remove()
    logEvent(LogEventType.DESTROYED, dev)
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

  if (dev) {
    c.DEV = dev
  }

  return c
}

const getMemberComponents = (component: Component | null): Array<Component> =>
  component ? [component] : []
