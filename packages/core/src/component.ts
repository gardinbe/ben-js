import { logEvent, LogEventType } from './dev'
import { createError, ErrorType } from './error'

export type Component = {
  readonly [ComponentSymbol]: true
  readonly [ComponentMarkerSymbol]?: Comment
  DEV?: ComponentDevState
  readonly destroy: () => void
  readonly hook: (payload: ComponentUsePayload) => Component
  readonly mount: (target: ComponentMountTarget) => void
  readonly setConnected: () => void // todo: consider renaming/restructuring this
  readonly setDisconnected: () => void
  readonly unmount: () => void
}

export const ComponentSymbol = Symbol('ben-js.component')
export const ComponentMarkerSymbol = Symbol('ben-js.component.marker')

export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && ComponentSymbol in value

export type ComponentDevState = {
  readonly children: Array<Component>
  readonly color: string
  readonly name: string
  readonly type: string
}

export type ComponentHook = (fn: ComponentHookFunction) => void
export type ComponentHookFunction = () => void

export type ComponentMountTarget = string | Node

export type ComponentUsePayload = {
  connected: ComponentHookFunction
  disconnected: ComponentHookFunction
}

export const connectComponents = (
  components: Iterable<Component> | undefined,
  dev: ComponentDevState | null,
  hooks: Set<ComponentHookFunction>,
) => {
  for (const component of components ?? []) {
    component.setConnected()
  }

  logEvent(LogEventType.CONNECTED, dev)
  hooks.forEach(fn => {
    fn()
  })
}

export const disconnectComponents = (
  components: Iterable<Component> | undefined,
  dev: ComponentDevState | null,
  hooks: Set<ComponentHookFunction>,
) => {
  for (const component of components ?? []) {
    component.setDisconnected()
  }

  logEvent(LogEventType.DISCONNECTED, dev)
  hooks.forEach(fn => {
    fn()
  })
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

export const getMountNode = (
  node: ComponentMountTarget,
  dev: ComponentDevState | null,
): ChildNode => {
  const target = typeof node === 'string' ? document.querySelector(node) : node

  if (!isChildNode(target)) {
    throw createError(ErrorType.MISSING_MOUNT_NODE, dev)
  }

  return target
}
