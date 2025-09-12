import { type AwaitableComponent } from '@ben-js/core';
import { type Derived, derived } from '@ben-js/reactivity';
import { type Route } from '../types/route';
import { currentPath } from '../path';
import { resolve } from '../resolve';

/**
 * Creates and returns a reactive component for the current route.
 * @param routes - Routes to use.
 * @returns Reactive component.
 */
export const Router = (routes: Route[]): Derived<AwaitableComponent> =>
  // todo: this fires twice on init
  derived(() => {
    const value = resolve(currentPath.value, routes);

    if (!value) {
      throw new Error(`@ben-js/router → no route resolved for '${currentPath.value}'`);
    }

    return typeof value.route.component === 'function'
      ? value.route.component(value.ctx)
      : value.route.component;
  });
