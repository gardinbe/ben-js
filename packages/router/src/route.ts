import { type Component } from '@ben-js/core';
import { derived, reactive } from '@ben-js/reactivity';

export type ResolvedRoute = {
  route: RouteDefinition;
  ctx: RouteContext;
};

export type RouteDefinition = {
  path: string;
  component: RouteComponent;
  children?: RouteDefinition[];
};

export type RouteContext = {
  [key: string]: string;
};

export type RouteComponent =
  | ((ctx: RouteContext) => Component)
  | ((ctx: RouteContext) => Promise<Component>)
  | Component
  | Promise<Component>;

export const currentRoutes = reactive<RouteDefinition[]>([]);

export const useRoutes = (routes: RouteDefinition[]): void => {
  currentRoutes.value = routes;
};

const DYNAMIC_SEGMENT_PATTERN = /^\[(.*)\]$/;

// todo: allow children of dynamic routes, support query params, middleware

export const resolve = (path: string): null | ResolvedRoute => {
  const segments = path.split('/').filter(Boolean);

  if (!segments.length) {
    segments.push('');
  }

  const walk = (
    routes: RouteDefinition[],
    index = 0,
    ctx: RouteContext = {},
  ): null | ResolvedRoute => {
    const segment = segments[index] ?? '';

    for (const route of routes) {
      if (route.path === '*') {
        return { ctx, route };
      }

      const param = route.path.match(DYNAMIC_SEGMENT_PATTERN)?.[1];

      if (!param && route.path !== segment) {
        continue;
      }

      const nextCtx = param ? { ...ctx, [param]: segment } : ctx;
      const isLast = index === segments.length - 1;

      if (isLast) {
        return { ctx: nextCtx, route };
      }

      if (!route.children) {
        continue;
      }

      const resolved = walk(route.children, index + 1, nextCtx);

      if (resolved) {
        return resolved;
      }
    }

    return null;
  };

  return walk(currentRoutes.value);
};

const currentPath = reactive(location.pathname);

export const currentRoute = derived(() => resolve(currentPath.value));

addEventListener('popstate', () => {
  currentPath.value = location.pathname;
});

export const go = (path: string): void => {
  currentPath.value = path;
  history.pushState(null, '', path);
};

export const back = (): void => {
  history.back();
};

export const isActivePath = (path: string): boolean => {
  const resolved = resolve(path);

  if (!currentRoute.value || !resolved) {
    return false;
  }

  const walk = (route: RouteDefinition): boolean =>
    route === currentRoute.value?.route || !!route.children?.some(walk);

  return walk(resolved.route);
};
