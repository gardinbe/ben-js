import {
  ComponentLifecycleEvent,
  recordComponentEvent,
} from '../internal/dev/utils'
import { createError, ErrorType } from '../internal/error'
import { InstanceSymbol } from '../internal/instance'

export type Component = {
  readonly destroy: () => void
  readonly mount: (target: ComponentMountTarget) => Comment
  readonly onConnect: (fn: ComponentHook) => Component
  readonly onDisconnect: (fn: ComponentHook) => Component
  readonly setConnected: () => void // todo: consider renaming/restructuring this
  readonly setDisconnected: () => void
  readonly unmount: () => void
}

type ComponentInstance = {
  readonly [InstanceSymbol.COMPONENT]: true
} & Component

export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && InstanceSymbol.COMPONENT in value

export type ComponentHook = () => Promise<void> | void

export type ComponentMountTarget = string | Node

type CreateComponentOptions = {
  readonly marker: Comment
  readonly destroy: () => void
  readonly getChildren: () => Array<Component> | undefined
  readonly mount: () => void
  readonly unmount: () => void
}

export const createComponent = ({
  destroy: destroyComponent,
  getChildren,
  marker,
  mount: mountComponent,
  unmount,
}: CreateComponentOptions): Component => {
  let isMounted = false

  const connectedHooks = new Set<ComponentHook>()
  const disconnectedHooks = new Set<ComponentHook>()

  const onConnect = (fn: ComponentHook) => {
    connectedHooks.add(fn)
    return self
  }

  const onDisconnect = (fn: ComponentHook) => {
    disconnectedHooks.add(fn)
    return self
  }

  const setConnected = () => {
    if (isMounted) {
      return
    }

    getChildren()?.forEach(component => component.setConnected())

    if (__DEV__) {
      recordComponentEvent(self, ComponentLifecycleEvent.CONNECTED)
    }

    connectedHooks.forEach(fn => fn())
    isMounted = true
  }

  const setDisconnected = () => {
    if (!isMounted) {
      return
    }

    getChildren()?.forEach(component => component.setDisconnected())

    if (__DEV__) {
      recordComponentEvent(self, ComponentLifecycleEvent.DISCONNECTED)
    }

    disconnectedHooks.forEach(fn => fn())
    isMounted = false
  }

  const mount = (node: ComponentMountTarget) => {
    const target = getMountNode(node)
    target.replaceWith(marker)

    mountComponent()

    if (!isInDocument(marker)) {
      setDisconnected()
      return marker
    }

    setConnected()
    return marker
  }

  const destroy = () => {
    destroyComponent()
    setDisconnected()

    if (__DEV__) {
      recordComponentEvent(self, ComponentLifecycleEvent.DESTROYED)
    }
  }

  const self: ComponentInstance = {
    destroy,
    [InstanceSymbol.COMPONENT]: true,
    mount,
    onConnect,
    onDisconnect,
    setConnected,
    setDisconnected,
    unmount,
  }

  return self
}

export const createComponentMembers = () => {
  const marker = document.createComment(COMPONENT_MEMBERS_MARKER)

  const mountMember = (component: Component) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER)
    marker.before(componentMarker)
    component.mount(componentMarker)
  }

  return {
    marker,
    mountMember,
  }
}

export const COMPONENT_MARKER = ' flame.component '
export const COMPONENT_CHILD_MARKER = ' flame.child-component '
export const COMPONENT_MEMBERS_MARKER = ' flame.members-component '
export const COMPONENT_MEMBER_MARKER = ' flame.member-component '

const isInDocument = (node: Node) =>
  node.isConnected && node.ownerDocument === document

const isChildNode = (node: unknown): node is ChildNode => {
  if (!node || typeof node !== 'object' || !('nodeType' in node)) {
    return false
  }

  const t = node.nodeType
  return t === 1 || t === 3 || t === 4 || t === 7 || t === 8 || t === 10
}

const getMountNode = (node: ComponentMountTarget): ChildNode => {
  const target = typeof node === 'string' ? document.querySelector(node) : node

  if (!isChildNode(target)) {
    throw createError(ErrorType.MISSING_MOUNT_NODE)
  }

  return target
}
