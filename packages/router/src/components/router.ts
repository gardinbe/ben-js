import { type AwaitableComponent } from '@ben-js/core';
import { type Derived, derived } from '@ben-js/reactivity';
import { currentRoute } from '../route';

/**
 * Creates and returns a reactive component for the current route.
 * @returns Reactive component.
 */
export const Router = (): Derived<AwaitableComponent> =>
  // todo: this fires twice on init
  derived(() => {
    const current = currentRoute.value;

    if (!current) {
      throw new Error(`@ben-js/router → no route resolved for '${current}'`);
    }

    return typeof current.route.component === 'function'
      ? current.route.component(current.ctx)
      : current.route.component;
  });
