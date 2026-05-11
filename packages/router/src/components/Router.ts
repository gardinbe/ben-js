import { type Component, Swap } from '@ben-js/core';
import { reactive, subscribe } from '@ben-js/reactivity';
import { currentRoute, useRoutes, type RouteDefinition } from '../route';
import { createError, ErrorType } from '../error';

export const Router = (routes: RouteDefinition[], routeComponent: () => Component) => {
  useRoutes(routes);
  const component = reactive(routeComponent());

  subscribe(currentRoute, () => {
    component.value = routeComponent();
  });

  return Swap(component);
};

export const Route = () => {
  const resolved = currentRoute.value;

  if (!resolved) {
    throw createError(ErrorType.MISSING_ROUTE);
  }

  const route = resolved.route.component;
  const component = typeof route === 'function' ? route(resolved.ctx) : route;
  return component;
};
