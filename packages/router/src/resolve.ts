import { type Route, type RouteWithContext } from './types/route';

const dynamicSegmentRx = /^\[(.*)\]$/;

/**
 * Resolves a path to a route and context.
 * @param path - Path to resolve.
 * @param routes - Routes to resolve from.
 * @returns Resolved route and context, or null if no route is found.
 */
export const resolve = (path: string, routes: Route[]): RouteWithContext | null => {
  const segments = path.split('/').filter((segment) => segment);

  /**
   * Resolves a segment to a route and context.
   * @param segment - Segment to resolve.
   * @param routes - Routes to resolve from.
   * @returns Resolved route and context, or null if no route is found.
   * @internal
   */
  const resolveSegment = (segment: string, routes: Route[]): RouteWithContext | null => {
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

  return resolveSegment(segments.shift() ?? '', routes);
};
