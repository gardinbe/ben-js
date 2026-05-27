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

  const dev = createComponentDev(ComponentType.DYNAMIC, memberComponents)

  const add = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node, dev)
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

    connectComponents(memberComponents(), dev, hooks.connected)
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    disconnectComponents(memberComponents(), dev, hooks.disconnected)
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
