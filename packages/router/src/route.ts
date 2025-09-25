import { type Component } from '@ben-js/core';
import { derived, reactive } from '@ben-js/reactivity';

/**
 * Represents a resolved route.
 */
export type ResolvedRoute = {
  /**
   * Current route context.
   */
  ctx: RouteContext;

  /**
   * Route definition.
   */
  route: RouteDefinition;
};

/**
 * Represents a route component/component constructor.
 */
export type Route =
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
 * Represents a route definition.
 */
export type RouteDefinition = {
  /**
   * Children of the route.
   */
  children?: RouteDefinition[];

  /**
   * Component of the route.
   */
  component: Route;

  /**
   * Path of the route.
   */
  path: string;
};

/**
 * Currently available routes.
 */
export const currentRoutes = reactive<RouteDefinition[]>([]);

/**
 * Sets the routes to use.
 * @param routes Routes to use.
 */
export const useRoutes = (routes: RouteDefinition[]): void => {
  currentRoutes.value = routes;
};

/**
 * Resolves a path to a route.
 * @param path Path to resolve.
 * @returns Resolved route, or null if no route is found.
 */
export const resolve = (path: string): null | ResolvedRoute => {
  const segments = path.split('/').filter((segment) => segment);

  // todo:
  // - allow children of dynamic routes
  // - support query params
  // - middleware

  const resolveSegment = (segment: string, routes: RouteDefinition[]): null | ResolvedRoute => {
    for (const route of routes) {
      if (route.path === '*') {
        return {
          ctx: {},
          route,
        };
      }

      const dynamicSegment = route.path.match(DynamicSegmentPattern)?.[1];

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

const DynamicSegmentPattern = /^\[(.*)\]$/;

const currentPath = reactive(location.pathname);

/**
 * Currently active route.
 */
export const currentRoute = derived(() => resolve(currentPath.value));

addEventListener('popstate', () => {
  currentPath.value = location.pathname;
});

/**
 * Navigates to a path.
 * @param path Path to navigate to.
 */
export const go = (path: string): void => {
  currentPath.value = path;
  history.pushState(null, '', path);
};

/**
 * Navigates to the previous route.
 */
export const back = (): void => {
  history.back();
};

/**
 * Checks if the provided path is active.
 * @param path Path to check.
 * @returns True if the path is active.
 */
export const isActive = (path: string): boolean => {
  const resolved = resolve(path);

  const find = (route: RouteDefinition): boolean =>
    route === currentRoute.value?.route || !!route.children?.some(find);

  return !!resolved && find(resolved.route);
};
