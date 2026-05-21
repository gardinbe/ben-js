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

export const Dynamic = <T>({
  diff,
  items,
  transform,
}: DynamicPayload<T>): Component => {
  const members = typeof items === 'function' ? derived(items) : items
  const memberComponents = () => members.value.map(transform)

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
        type: ComponentType.DYNAMIC,
        get children() {
          return memberComponents()
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

    memberComponents().forEach(component => {
      add(component)
    })

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

    memberComponents().forEach(component => {
      component.setConnected()
    })

    logEvent(LogEventType.CONNECTED, DEV)
    hooks.connected.forEach(fn => {
      fn()
    })
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    memberComponents().forEach(component => {
      component.setDisconnected()
    })

    logEvent(LogEventType.DISCONNECTED, DEV)
    hooks.disconnected.forEach(fn => {
      fn()
    })
  }

  const unmount = () => {
    memberComponents().forEach(component => {
      component.unmount()
    })
    marker.remove()
  }

  const destroy = () => {
    memberComponents().forEach(component => {
      component.destroy()
    })
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

  watch(members, (next, previous) => {
    previous
      .filter(diff.removeOld(next))
      .map(transform)
      .forEach(component => {
        component.destroy()
      })

    next
      .filter(diff.addNew(previous))
      .map(transform)
      .forEach(component => {
        add(component)
      })
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

export type DynamicPayload<T> = {
  diff: DynamicPayloadDiff<T>
  items: (() => Array<T>) | Reactive<Array<T>>
  transform: (item: T) => Component
}

export type DynamicPayloadDiff<T> = {
  addNew: (previous: Array<T>) => (nextItem: T) => boolean
  removeOld: (next: Array<T>) => (previousItem: T) => boolean
}

export type KeyedComponent = {
  component: Component
  key: PropertyKey
}
