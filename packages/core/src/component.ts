import { createError, ErrorType } from './error'

export interface Component {
  readonly [ComponentSymbol]: true
  DEV?: ComponentDevState
  readonly destroy: () => void
  readonly hook: (payload: ComponentUsePayload) => this
  readonly mount: (target: ComponentMountTarget) => void
  readonly setConnected: () => void // todo: consider renaming/restructuring this
  readonly setDisconnected: () => void
  readonly unmount: () => void
}

export const ComponentSymbol = Symbol('ben-js.component')

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

export const ANONYMOUS_COMPONENT_NAME = '[anonymous]'

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
  DEV: ComponentDevState | null,
): ChildNode => {
  const target = typeof node === 'string' ? document.querySelector(node) : node

  if (!isChildNode(target)) {
    throw createError(ErrorType.MISSING_MOUNT_NODE, DEV)
  }

  return target
}
