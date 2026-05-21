import { derived, type Reactive, watch } from '@ben-js/reactivity'

import {
  ANONYMOUS_COMPONENT_NAME,
  type Component,
  COMPONENT_MEMBER_MARKER,
  COMPONENT_MEMBERS_MARKER,
  type ComponentDevState,
  type ComponentHookFunction,
  type ComponentMountTarget,
  ComponentSymbol,
  type ComponentUsePayload,
  getMountNode,
  isInDocument,
} from '../component'
import {
  ComponentType,
  getCallerFunctionName,
  IS_DEV,
  logEvent,
  LogEventType,
  randomHexColor,
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

  const DEV: ComponentDevState | null = IS_DEV
    ? {
        color: randomHexColor(),
        name: getCallerFunctionName() ?? ANONYMOUS_COMPONENT_NAME,
        type: ComponentType.SWAP,
        get children() {
          return memberComponent.value ? [memberComponent.value] : []
        },
      }
    : null

  const add = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, DEV)
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

    memberComponent.value?.setConnected()

    logEvent(LogEventType.CONNECTED, DEV)
    hooks.connected.forEach(fn => {
      fn()
    })
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    memberComponent.value?.setDisconnected()

    logEvent(LogEventType.DISCONNECTED, DEV)
    hooks.disconnected.forEach(fn => {
      fn()
    })
  }

  const unmount = () => {
    memberComponent.value?.unmount()
    marker.remove()
  }

  const destroy = () => {
    memberComponent.value?.destroy()
    marker.remove()
    logEvent(LogEventType.DESTROYED, DEV)
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
    [ComponentSymbol]: true,
    destroy,
    hook,
    mount,
    setConnected,
    setDisconnected,
    unmount,
  }

  if (DEV) {
    c.DEV = DEV
  }

  return c
}
