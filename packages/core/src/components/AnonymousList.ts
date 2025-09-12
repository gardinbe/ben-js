import { derived, type Reactive } from '@ben-js/reactivity';

import { type Component } from '../component';
import { type KeyedComponent, List } from './List';

/**
 * Creates an anonymous list component.
 * @param items Function that returns/a reactive of components.
 * @returns Anonymous list component.
 */
export const AnonymousList = (items: (() => Component[]) | Reactive<Component[]>): Component => {
  const rx = typeof items === 'function' ? derived(items) : items;
  return List(() =>
    rx.value.map<KeyedComponent>((component) => ({
      component,
      key: Symbol(),
    })),
  );
};
