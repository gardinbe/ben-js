import { reactive } from '@ben-js/reactivity';

import { type Component } from '../component';
import { AnonymousList } from './AnonymousList';

/**
 * Creates a deferred component.
 * @param component Awaitable component.
 * @param loader Loader component.
 * @returns Deferred component.
 */
export const Deferred = (component: PromiseLike<Component>, loader?: Component): Component => {
  const rx = reactive<Component | null>(loader ?? null);

  if (loader) {
    rx.value = loader;
  }

  void component.then((resolvedComponent) => {
    rx.value = resolvedComponent;
  });

  return AnonymousList(() => (rx.value ? [rx.value] : []));
};
