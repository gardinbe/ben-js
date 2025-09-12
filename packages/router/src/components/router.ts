import { type Component, Deferred, isComponent, Swap } from '@ben-js/core';

import { currentRoute } from '../route';

/**
 * Creates a reactive component for the current route.
 * @returns Reactive component.
 */
export const Router = (): Component =>
  // todo: this fires twice on init
  Swap(() => {
    // todo: this does not destroy old component.
    // make it so Route cannot be static component- must be component constructor
    // then either here, or in route.ts, destroy old component on change
    // test this by viewing todo-list, its got window click listeners - see how many get outputted

    const current = currentRoute.value;

    if (!current) {
      throw new Error(`@ben-js/router → no route resolved`);
    }

    const routeComponent = current.route.component;
    const component =
      typeof routeComponent === 'function' ? routeComponent(current.ctx) : routeComponent;

    if (isComponent(component)) {
      return component;
    } else {
      return Deferred(component);
    }
  });
