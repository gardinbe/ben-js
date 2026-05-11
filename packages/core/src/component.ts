import { ErrorType, createError } from './error';

export interface Component {
  readonly [ComponentSymbol]: true;
  readonly mount: (target: ComponentMountTarget) => void;
  readonly unmount: () => void;
  readonly destroy: () => void;
  readonly hook: (payload: ComponentUsePayload) => this;
  readonly setConnected: () => void; // todo: consider renaming/restructuring this
  readonly setDisconnected: () => void;
  _dev?: ComponentDevState;
}

export const ComponentSymbol = Symbol('ben-js.component');

export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && ComponentSymbol in value;

export type ComponentMountTarget = Node | string;

export type ComponentUsePayload = {
  connected: ComponentHookFunction;
  disconnected: ComponentHookFunction;
};

export type ComponentHook = (fn: ComponentHookFunction) => void;
export type ComponentHookFunction = () => void;

export type ComponentDevState = {
  readonly name: string;
  readonly children: Component[];
  readonly color: string;
  readonly type: string;
};

export const ANONYMOUS_COMPONENT_NAME = '[anonymous]';

export const COMPONENT_MARKER = ' ben-js.component ';
export const COMPONENT_CHILD_MARKER = ' ben-js.child-component ';
export const COMPONENT_MEMBERS_MARKER = ' ben-js.members-component ';
export const COMPONENT_MEMBER_MARKER = ' ben-js.member-component ';

export const inDocument = (node: Node) => node.isConnected && node.ownerDocument === document;

export type ComponentMountNodes = {
  target: Node;
  parent: ParentNode;
};

export const getMountNodes = (
  node: ComponentMountTarget,
  DEV: ComponentDevState | null,
): ComponentMountNodes => {
  const target = typeof node === 'string' ? document.querySelector(node) : node;

  if (!target) {
    throw createError(ErrorType.MISSING_MOUNT_NODE, DEV);
  }

  const parent = target.parentNode;

  if (!parent) {
    throw createError(ErrorType.PARENT_IS_ORPHAN, DEV);
  }

  return {
    target,
    parent,
  };
};
