import { type AwaitableComponent } from '@ben-js/core';

/**
 * Represents a route.
 */
export type Route = {
  /**
   * Path of the route.
   */
  path: string;

  /**
   * Component of the route.
   */
  component: RouteComponent;

  /**
   * Children of the route.
   */
  children?: Route[];
};

/**
 * Represents a route component.
 */
export type RouteComponent = AwaitableComponent | ((ctx: RouteContext) => AwaitableComponent);

/**
 * Represents a route context.
 */
export type RouteContext = {
  /**
   * Current value of the dynamic route segment if present.
   */
  readonly [key: string]: string;
};

/**
 * Represents a route with a context.
 */
export type RouteWithContext = {
  /**
   * Route.
   */
  readonly route: Route;

  /**
   * Current route context.
   */
  readonly ctx: RouteContext;
};
