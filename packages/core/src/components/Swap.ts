import { derived, type Reactive } from '@ben-js/reactivity';

import { type Component } from '../component';
import { AnonymousList } from './AnonymousList';

/**
 * Creates a swap component.
 * @param item Function that returns/a reactive component.
 * @returns Component.
 */
export const Swap = (item: (() => Component) | Reactive<Component>): Component => {
  const rx = typeof item === 'function' ? derived(item) : item;
  return AnonymousList(() => [rx.value]);
};
