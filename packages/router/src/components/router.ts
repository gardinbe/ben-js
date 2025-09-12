import { type Component } from '@ben-js/core';
import { type Derived, derived } from '@ben-js/reactivity';

import { currentRoute } from '../route';

/**
 * Creates and returns a reactive component for the current route.
 * @returns Reactive component.
 */
export const Router = (): Derived<Component | Promise<Component>> =>
  // todo: this fires twice on init
  derived(() => {
    const current = currentRoute.value;

    if (!current) {
      throw new Error(`@ben-js/router → no route resolved`);
    }

    const rc = current.route.component;
    return typeof rc === 'function' ? rc(current.ctx) : rc;
  });
