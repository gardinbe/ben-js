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
  const memberComponent = typeof item === 'function' ? derived(item) : item

  const marker = document.createComment(COMPONENT_MEMBERS_MARKER)
  const isMounted = false

  const hooks = {
    connected: new Set<ComponentHookFunction>(),
    disconnected: new Set<ComponentHookFunction>(),
  }

  const dev = createComponentDev(ComponentType.SWAP, () =>
    getMemberComponents(memberComponent.value),
  )

  const add = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, dev)
    target.replaceWith(marker)

    if (memberComponent.value) {
      add(memberComponent.value)
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

    connectComponents(
      getMemberComponents(memberComponent.value),
      dev,
      hooks.connected,
    )
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    disconnectComponents(
      getMemberComponents(memberComponent.value),
      dev,
      hooks.disconnected,
    )
  }

  const unmount = () => {
    memberComponent.value?.unmount()
    marker.remove()
  }

  const destroy = () => {
    memberComponent.value?.destroy()
    marker.remove()
    logEvent(LogEventType.DESTROYED, dev)
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

  watch(memberComponent, (next, previous) => {
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
