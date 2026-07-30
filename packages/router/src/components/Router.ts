import { type Component, Swap } from '@flame/core'
import { reactive, subscribe } from '@flame/reactivity'

import { createError, ErrorType } from '../internal/error'
import {
  currentRoute,
  type RouteDefinition,
  useRoutes,
} from '../primitives/route'

export const Router = (
  routes: Array<RouteDefinition>,
  routeComponent: () => Component,
) => {
  useRoutes(routes)
  const component = reactive(routeComponent())

  subscribe(currentRoute, () => {
    component.value = routeComponent()
  })

  return Swap(component)
}

export const Route = () => {
  const resolved = currentRoute.value

  if (!resolved) {
    throw createError(ErrorType.MISSING_ROUTE)
  }

  const route = resolved.route.component
  const component = typeof route === 'function' ? route(resolved.ctx) : route
  return component
}
