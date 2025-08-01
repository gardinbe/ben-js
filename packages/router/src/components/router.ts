import { derived } from '@ben-js/reactivity';
import { currentRoute } from '../route';

/**
 * Creates and returns a reactive component for the current route.
 * @returns Reactive component.
 */
export const Router = () =>
  // todo: this fires twice on init
  derived(() => {
    const current = currentRoute.value;

    if (!current) {
      throw new Error(`@ben-js/router → no route resolved for '${current}'`);
    }

    const rc = current.route.component;
    return typeof rc === 'function' ? rc(current.ctx) : rc;
  });
