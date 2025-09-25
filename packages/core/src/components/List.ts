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
  const marker = document.createComment(ComponentMarker);
  const rx = typeof items === 'function' ? derived(items) : items;
  const members = reactive<Map<PropertyKey, Component>>(new Map());
  const hooks = {
    mounted: new Set<HookFunction>(),
    unmounted: new Set<HookFunction>(),
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
    members.value.forEach((member) => {
      mountMember(member);
    });
    hooks.mounted.forEach((fn) => {
      fn();
    });
  };

  const unmount: Component['unmount'] = () => {
    members.value.forEach((member) => {
      member.unmount();
    });
    marker.remove();
    hooks.unmounted.forEach((fn) => {
      fn();
    });
  };

  const destroy: Component['destroy'] = () => {
    members.value.forEach((member) => {
      member.destroy();
    });
    unmount();
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
    (next, prev) => {
      prev
        ?.filter((prevItem) => !next.some((nextItem) => nextItem.key === prevItem.key))
        .map((item) => members.value.get(item.key))
        .filter((key) => !!key)
        .forEach((component) => {
          component.destroy();
        });

      next
        .filter((nextItem) => !prev?.some((prevItem) => prevItem.key === nextItem.key))
        .map((item) => item.component)
        .forEach((component) => {
          mountMember(component);
        });

      members.value = new Map(
        next.map((item) => [item.key, members.value.get(item.key) ?? item.component]),
      );
    },
    {
      immediate: true,
    },
  );

  return {
    [ComponentSymbol]: true,
    destroy,
    hooks: {
      mounted: (fn: HookFunction): void => {
        hooks.mounted.add(fn);
      },
      unmounted: (fn: HookFunction): void => {
        hooks.unmounted.add(fn);
      },
    },
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
