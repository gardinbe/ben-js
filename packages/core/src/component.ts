import { ComponentLifecycleEvent, recordComponentEvent } from './development'
import { createError, ErrorType } from './error'

export type Component = {
  readonly [ComponentSymbol]: true
  readonly destroy: () => void
  readonly hook: (payload: ComponentUsePayload) => Component
  readonly mount: (target: ComponentMountTarget) => void
  readonly setConnected: () => void // todo: consider renaming/restructuring this
  readonly setDisconnected: () => void
  readonly unmount: () => void
}

export const ComponentSymbol = Symbol('ben-js.component')

export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && ComponentSymbol in value

export type ComponentHook = (fn: ComponentHookFunction) => void
export type ComponentHookFunction = () => void

export type ComponentMountTarget = string | Node

export type ComponentUsePayload = {
  connected: ComponentHookFunction
  disconnected: ComponentHookFunction
}

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

  const connectedHooks = new Set<ComponentHookFunction>()
  const disconnectedHooks = new Set<ComponentHookFunction>()

  const hook = (payload: ComponentUsePayload) => {
    if (payload.connected) {
      connectedHooks.add(payload.connected)
    }

    if (payload.disconnected) {
      disconnectedHooks.add(payload.disconnected)
    }

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
      return
    }

    setConnected()
  }

  const destroy = () => {
    destroyComponent()
    setDisconnected()

    if (__DEV__) {
      recordComponentEvent(self, ComponentLifecycleEvent.DESTROYED)
    }
  }

  const self: Component = {
    [ComponentSymbol]: true,
    destroy,
    hook,
    mount,
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

export const COMPONENT_MARKER = ' ben-js.component '
export const COMPONENT_CHILD_MARKER = ' ben-js.child-component '
export const COMPONENT_MEMBERS_MARKER = ' ben-js.members-component '
export const COMPONENT_MEMBER_MARKER = ' ben-js.member-component '

export const isInDocument = (node: Node) =>
  node.isConnected && node.ownerDocument === document

const isChildNode = (node: unknown): node is ChildNode => {
  if (!node || typeof node !== 'object' || !('nodeType' in node)) {
    return false
  }

  const t = node.nodeType
  return t === 1 || t === 3 || t === 4 || t === 7 || t === 8 || t === 10
}

export const getMountNode = (node: ComponentMountTarget): ChildNode => {
  const target = typeof node === 'string' ? document.querySelector(node) : node

  if (!isChildNode(target)) {
    throw createError(ErrorType.MISSING_MOUNT_NODE)
  }

  return target
}
