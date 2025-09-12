import { type Component } from '@ben-js/core';
import { derived, reactive, type Reactive } from '@ben-js/reactivity';

/**
 * Represents a resolved route.
 */
export type ResolvedRoute = {
  /**
   * Current route context.
   */
  ctx: RouteContext;

  /**
   * Route.
   */
  route: Route;
};

/**
 * Represents a route.
 */
export type Route = {
  /**
   * Children of the route.
   */
  children?: Route[];

  /**
   * Component of the route.
   */
  component: RouteComponent;

  /**
   * Path of the route.
   */
  path: string;
};

/**
 * Represents a route component.
 */
export type RouteComponent =
  | ((ctx: RouteContext) => Component)
  | ((ctx: RouteContext) => Promise<Component>)
  | Component
  | Promise<Component>;

/**
 * Represents a route context.
 */
export type RouteContext = {
  /**
   * Current value of the dynamic route segment if present.
   */
  [key: string]: string;
};

/**
 * Represents the current routes.
 */
export const currentRoutes = reactive<Route[]>([]);

/**
 * Sets the current routes.
 */
export const setRoutes = (routes: Route[]): void => {
  currentRoutes.value = routes;
};

/**
 * Resolves a path to a route and context.
 * @param path Path to resolve.
 * @returns Resolved route and context, or null if no route is found.
 */
export const resolve = (path: string): null | ResolvedRoute => {
  const segments = path.split('/').filter((segment) => segment);

  const resolveSegment = (segment: string, routes: Route[]): null | ResolvedRoute => {
    for (const route of routes) {
      if (route.path === '*') {
        return {
          ctx: {},
          route,
        };
      }

      const dynamicSegment = route.path.match(dynamicSegmentRx)?.[1];

      if (dynamicSegment) {
        return {
          ctx: {
            [dynamicSegment]: segment,
          },
          route,
        };
      }

      if (route.path === segment) {
        const nextSegment = segments.shift();

        if (nextSegment && route.children) {
          return resolveSegment(nextSegment, route.children);
        }

        return {
          ctx: {},
          route,
        };
      }
    }

    return null;
  };

  return resolveSegment(segments.shift() ?? '', currentRoutes.value);
};

const dynamicSegmentRx = /^\[(.*)\]$/;

/**
 * Represents the current route.
 */
// todo: hacky manually updating derived value
export const currentRoute = derived(() =>
  resolve(location.pathname),
) as Reactive<null | ResolvedRoute>;

addEventListener('popstate', () => {
  currentRoute.value = resolve(location.pathname);
});

/**
 * Checks if the provided path is active.
 * @param path Path to check.
 * @returns True if the path is active.
 */
export const isActive = (path: string): boolean => {
  const resolved = resolve(path);

  const find = (route: Route): boolean =>
    route === currentRoute.value?.route || !!route.children?.some(find);

  return !!resolved && find(resolved.route);
};

/**
 * Navigates to a path.
 * @param path Path to navigate to.
 */
export const go = (path: string): void => {
  const resolved = resolve(path);
  currentRoute.value = resolved;
  history.pushState(null, '', path);
};

/**
 * Navigates to the previous route.
 */
export const back = (): void => {
  history.back();
};

/**
 * Wraps a route component constructor with uniform props.
 * @param fn Route component constructor.
 * @returns Route component constructor with uniform props.
 */
export const route = (fn: RouteComponent): typeof fn => fn;
