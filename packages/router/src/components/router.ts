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
    const current = resolve(currentPath.value, routes);

    if (!current) {
      throw new Error(`@ben-js/router → no route resolved for '${currentPath.value}'`);
    }

    return typeof current.route.component === 'function'
      ? current.route.component(current.ctx)
      : current.route.component;
  });
