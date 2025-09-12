import { derived, type Reactive, watch } from '@ben-js/reactivity';

import {
  ChildComponentMarker,
  type Component,
  ComponentMarker,
  ComponentSymbol,
} from '../component';

/**
 * Creates and returns a dynamic component.
 * @param reactive Reactive array of keyed components.
 * @returns Dynamic component.
 */
export const Dynamic = (reactive: Reactive<KeyedComponent[]>): Component => {
  const marker = document.createComment(ComponentMarker);
  const members = derived<Map<Key, Component>>(
    (prev) =>
      new Map(reactive.value.map((item) => [item.key, prev?.get(item.key) ?? item.component])),
  );

  const mount: Component['mount'] = (arg) => {
    const targetNode = typeof arg === 'string' ? document.querySelector(arg) : arg;

    if (!targetNode) {
      throw new Error('ben-js: missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js: mount node has no parent');
    }

    parent.replaceChild(marker, targetNode);
    members.value.forEach(mountMember);
  };

  const unmount: Component['unmount'] = () => {
    members.value.forEach((member) => {
      member.unmount();
    });
    const parent = marker.parentNode;
    parent?.removeChild(marker);
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

  watch(members, (next, prev) => {
    [...prev]
      .filter(([key]) => !next.has(key))
      .forEach(([, member]) => {
        member.unmount();
      });
    [...next]
      .filter(([key]) => !prev.has(key))
      .forEach(([, member]) => {
        mountMember(member);
      });
  });

  return {
    [ComponentSymbol]: true,
    mount,
    render,
    unmount,
  };
};

/**
 * Represents a unique key.
 */
export type Key = number | string | symbol;

/**
 * Represents a keyed component.
 */
export type KeyedComponent = {
  component: Component;
  key: Key;
};
