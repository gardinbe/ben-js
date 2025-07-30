import { derived, reactive, type Reactive } from '@ben-js/reactivity';
import { type Component } from '@ben-js/core';

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
export type RouteComponent =
  | Component
  | Promise<Component>
  | ((ctx: RouteContext) => Component)
  | ((ctx: RouteContext) => Promise<Component>);

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
 * Represents a resolved route.
 */
export type ResolvedRoute = {
  /**
   * Route.
   */
  readonly route: Route;

  /**
   * Current route context.
   */
  readonly ctx: RouteContext;
};

/**
 * Represents the current routes.
 */
export const currentRoutes = reactive<Route[]>([]);

/**
 * Sets the current routes.
 */
export const setRoutes = (routes: Route[]) => (currentRoutes.value = routes);

const dynamicSegmentRx = /^\[(.*)\]$/;

/**
 * Resolves a path to a route and context.
 * @param path Path to resolve.
 * @returns Resolved route and context, or null if no route is found.
 */
export const resolve = (path: string): ResolvedRoute | null => {
  const segments = path.split('/').filter((segment) => segment);

  /**
   * Resolves a segment to a route and context.
   * @param segment Segment to resolve.
   * @param routes Routes to resolve from.
   * @returns Resolved route and context, or null if no route is found.
   * @internal
   */
  const resolveSegment = (segment: string, routes: Route[]): ResolvedRoute | null => {
    for (const route of routes) {
      if (route.path === '*') {
        return { route, ctx: {} };
      }

      const dynamicSegment = route.path.match(dynamicSegmentRx)?.[1];

      if (dynamicSegment) {
        return { route, ctx: { [dynamicSegment]: segment } };
      }

      if (route.path === segment) {
        const nextSegment = segments.shift();

        if (nextSegment && route.children) {
          return resolveSegment(nextSegment, route.children);
        }

        return { route, ctx: {} };
      }
    }

    return null;
  };

  return resolveSegment(segments.shift() ?? '', currentRoutes.value);
};

/**
 * Represents the current route.
 */
// todo: hacky manually updating derived value
export const currentRoute = derived(() =>
  resolve(location.pathname)
) as Reactive<ResolvedRoute | null>;

addEventListener('popstate', () => (currentRoute.value = resolve(location.pathname)));

/**
 * Checks if the provided path is active.
 * @param path Path to check.
 * @returns True if the path is active.
 */
export const isActive = (path: string) => {
  const resolved = resolve(path);

  const find = (route: Route): boolean =>
    route === currentRoute.value?.route || !!route.children?.some(find);

  return !!resolved && find(resolved.route);
};

/**
 * Navigates to a path.
 * @param path Path to navigate to.
 */
export const go = (path: string) => {
  const resolved = resolve(path);
  currentRoute.value = resolved;
  history.pushState(null, '', path);
};

/**
 * Navigates to the previous route.
 */
export const back = () => history.back();
