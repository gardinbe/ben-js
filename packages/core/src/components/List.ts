import { derived, reactive, type Reactive, watch } from '@ben-js/reactivity';

import {
  ChildComponentMarker,
  type Component,
  ComponentMarker,
  ComponentSymbol,
  type HookFunction,
} from '../component';

/**
 * Creates a list component.
 * @param items Function that returns/a reactive of keyed components.
 * @returns List component.
 */
export const List = (items: (() => KeyedComponent[]) | Reactive<KeyedComponent[]>): Component => {
  const rx = typeof items === 'function' ? derived(items) : items;
  const marker = document.createComment(ComponentMarker);
  const members = reactive<Map<PropertyKey, Component>>(new Map());

  const callbacks = {
    mounted: new Set<HookFunction>(),
    unmounted: new Set<HookFunction>(),
  };

  const hooks: Component['hooks'] = {
    mounted: (fn: HookFunction): void => {
      callbacks.mounted.add(fn);
    },
    unmounted: (fn: HookFunction): void => {
      callbacks.unmounted.add(fn);
    },
  };

  const mount: Component['mount'] = (target) => {
    const targetNode = typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetNode) {
      throw new Error('ben-js: missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js: mount node has no parent');
    }

    parent.replaceChild(marker, targetNode);
    members.value.forEach(mountMember);
    callbacks.mounted.forEach((fn) => {
      fn();
    });
  };

  const unmount: Component['unmount'] = () => {
    members.value.forEach((member) => {
      member.unmount();
    });
    marker.remove();
    callbacks.unmounted.forEach((fn) => {
      fn();
    });
  };

  const destroy: Component['destroy'] = () => {
    // todo: this is duplicated from unmount
    members.value.forEach((member) => {
      member.destroy();
    });
    marker.remove();
    callbacks.unmounted.forEach((fn) => {
      fn();
    });
  };

  const render: Component['render'] = () => {
    members.value.forEach((member) => {
      member.render();
    });
  };

  const mountMember = (member: Component): void => {
    const parent = marker.parentNode;

    if (!parent) {
      return;
    }

    const memberMarker = document.createComment(ChildComponentMarker);
    parent.insertBefore(memberMarker, marker);
    member.mount(memberMarker);
  };

  watch(
    rx,
    (next) => {
      [...members.value]
        .filter(([key]) => !next.some((item) => item.key === key))
        .forEach(([, member]) => {
          member.unmount();
        });

      members.value = new Map(
        rx.value.map((item) => [item.key, members.value.get(item.key) ?? item.component]),
      );

      [...members.value]
        .filter(([key]) => next.some((item) => item.key === key))
        .forEach(([, member]) => {
          mountMember(member);
        });
    },
    {
      immediate: true,
    },
  );

  return {
    [ComponentSymbol]: true,
    destroy,
    hooks,
    mount,
    render,
    unmount,
  };
};

/**
 * Represents a keyed component.
 */
export type KeyedComponent = {
  component: Component;
  key: PropertyKey;
};
