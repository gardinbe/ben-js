import { derived, watch, type Reactive } from '@ben-js/reactivity';
import { ChildComponentMarker, ComponentMarker } from '../_internal/constants';
import { ComponentSymbol, type Component } from '../component';

/**
 * Creates and returns a dynamic component.
 * @param reactive - Function which returns an array of components.
 * @returns Dynamic component.
 */
export const Dynamic = (reactive: Reactive<KeyedComponent[]>): Component => {
  const marker = document.createComment(ComponentMarker);
  // todo: consider not using watcher
  const members = derived<Map<Key, Component>>(
    (prev) =>
      new Map(reactive.value.map((item) => [item.key, prev?.get(item.key) ?? item.component]))
  );

  const mount: Component['mount'] = (arg) => {
    const targetNode = typeof arg === 'string' ? document.querySelector(arg) : arg;

    if (!targetNode) {
      throw new Error('ben-js → missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js → mount node has no parent');
    }

    parent.replaceChild(marker, targetNode);
    members.value.forEach(mountMember);
  };

  const unmount: Component['unmount'] = () => {
    const parent = marker.parentNode;
    parent?.removeChild(marker);
    members.value.forEach((member) => member.unmount());
  };

  const render: Component['render'] = () => {
    members.value.forEach((member) => member.render());
  };

  /**
   * Mounts a member.
   * @internal
   */
  const mountMember = (member: Component) => {
    const parent = marker.parentNode;

    if (!parent) {
      return;
    }

    const memberMarker = document.createComment(ChildComponentMarker);
    parent.insertBefore(memberMarker, marker);
    member.mount(memberMarker);
  };

  watch(members, (next, prev) => {
    const prevMembers = [...prev].filter(([prevKey]) => !next.has(prevKey));
    const nextMembers = [...next].filter(([nextKey]) => !prev.has(nextKey));
    prevMembers.forEach(([, member]) => member.unmount());
    nextMembers.forEach(([, member]) => mountMember(member));
  });

  return {
    mount,
    unmount,
    render,
    [ComponentSymbol]: true
  };
};

/**
 * Represents a unique key.
 */
export type Key = string | number | symbol;

/**
 * Represents a keyed component.
 */
export type KeyedComponent = {
  key: Key;
  component: Component;
};
