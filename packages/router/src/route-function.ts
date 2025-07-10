import type { RouteComponent } from './route';

/**
 * Creates and returns a Route component.
 * @param fn Route component function.
 * @returns Route component.
 */
export const route = (fn: RouteComponent) => fn;
