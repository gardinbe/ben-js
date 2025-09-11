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
  const current = reactive<Component | null>(loader ?? null);

  if (loader) {
    current.value = loader;
  }

  void component.then((resolvedComponent) => {
    current.value = resolvedComponent;
  });

  return AnonymousList(() => (current.value ? [current.value] : []));
};
