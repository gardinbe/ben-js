import { type Component, Deferred, isComponent, Swap } from '@ben-js/core';
import { reactive, subscribe } from '@ben-js/reactivity';

import { currentRoute } from '../route';

/**
 * Creates a reactive component for the current route.
 * @returns Reactive component.
 */
export const Router = (): Component => {
  const component = reactive(create());
  subscribe(currentRoute, () => {
    component.value = create();
  });
  return Swap(component);
};

const create = (): Component => {
  const resolved = currentRoute.value;

  if (!resolved) {
    throw new Error(`@ben-js/router → no route resolved`);
  }

  const route = resolved.route.component;
  const component = typeof route === 'function' ? route(resolved.ctx) : route;
  return isComponent(component) ? component : Deferred(component);
};
