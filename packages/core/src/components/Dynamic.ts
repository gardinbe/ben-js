import { derived, type Reactive, watch } from '@ben-js/reactivity';

import {
  ComponentDevState,
  ANONYMOUS_COMPONENT_NAME,
  type Component,
  ComponentSymbol,
  type ComponentHookFunction,
  inDocument,
  COMPONENT_MEMBER_MARKER,
  COMPONENT_MEMBERS_MARKER,
  type ComponentUsePayload,
  type ComponentMountTarget,
  getMountNodes,
} from '../component';
import { getCallerFunctionName } from '../dev';
import { ComponentType, IS_DEV, logEvent, LogEventType, randomHexColor } from '../dev';

export const Dynamic = <T>({ items, transform, diff }: DynamicPayload<T>): Component => {
  const members = typeof items === 'function' ? derived(items) : items;
  const memberComponents = () => members.value.map(transform);

  const marker = document.createComment(COMPONENT_MEMBERS_MARKER);
  let isMounted = false;

  const hooks = {
    connected: new Set<ComponentHookFunction>(),
    disconnected: new Set<ComponentHookFunction>(),
  };

  const DEV: ComponentDevState | null = IS_DEV
    ? {
        name: getCallerFunctionName() ?? ANONYMOUS_COMPONENT_NAME,
        get children() {
          return memberComponents();
        },
        color: randomHexColor(),
        type: ComponentType.DYNAMIC,
      }
    : null;

  const add = (component: Component, parent: ParentNode) => {
    const componentMarker = document.createComment(COMPONENT_MEMBER_MARKER);
    parent.insertBefore(componentMarker, marker);
    component.mount(componentMarker);
  };

  const mount = (node: ComponentMountTarget) => {
    const { target, parent } = getMountNodes(node, DEV);
    parent.replaceChild(marker, target);

    memberComponents().forEach((component) => {
      add(component, parent);
    });

    if (!inDocument(marker)) {
      setDisconnected();
      return;
    }

    setConnected();
  };

  const setConnected = () => {
    if (isMounted) {
      return;
    }

    memberComponents().forEach((component) => {
      component.setConnected();
    });

    logEvent(LogEventType.CONNECTED, DEV);
    hooks.connected.forEach((fn) => {
      fn();
    });
  };

  const setDisconnected = () => {
    if (!isMounted) {
      return;
    }

    memberComponents().forEach((component) => {
      component.setDisconnected();
    });

    logEvent(LogEventType.DISCONNECTED, DEV);
    hooks.disconnected.forEach((fn) => {
      fn();
    });
  };

  const unmount = () => {
    memberComponents().forEach((component) => {
      component.unmount();
    });
    marker.remove();
  };

  const destroy = () => {
    memberComponents().forEach((component) => {
      component.destroy();
    });
    marker.remove();
    logEvent(LogEventType.DESTROYED, DEV);
  };

  const hook = (payload: ComponentUsePayload) => {
    if (payload.connected) {
      hooks.connected.add(payload.connected);
    }

    if (payload.disconnected) {
      hooks.disconnected.add(payload.disconnected);
    }

    return c;
  };

  watch(members, (next, prev) => {
    const parent = marker.parentNode;

    if (!parent) {
      return;
    }

    prev
      .filter(diff.removeOld(next))
      .map(transform)
      .forEach((component) => {
        component.destroy();
      });

    next
      .filter(diff.addNew(prev))
      .map(transform)
      .forEach((component) => {
        add(component, parent);
      });
  });

  const c: Component = {
    [ComponentSymbol]: true,
    mount,
    unmount,
    destroy,
    hook,
    setConnected,
    setDisconnected,
  };

  if (DEV) {
    c._dev = DEV;
  }

  return c;
};

export type DynamicPayload<T> = {
  items: (() => T[]) | Reactive<T[]>;
  transform: (item: T) => Component;
  diff: DynamicPayloadDiff<T>;
};

export type DynamicPayloadDiff<T> = {
  removeOld: (next: T[]) => (prevItem: T) => boolean;
  addNew: (prev: T[]) => (nextItem: T) => boolean;
};

export type KeyedComponent = {
  component: Component;
  key: PropertyKey;
};
