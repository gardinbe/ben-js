import { type Component } from '@ben-js/core'
import { derived, reactive } from '@ben-js/reactivity'

export type ResolvedRoute = {
  ctx: RouteContext
  route: RouteDefinition
}

export type RouteComponent =
  | ((ctx: RouteContext) => Component)
  | ((ctx: RouteContext) => Promise<Component>)
  | Component
  | Promise<Component>

export type RouteContext = {
  [key: string]: string
}

export type RouteDefinition = {
  component: RouteComponent
  path: string
  children?: Array<RouteDefinition>
}

export const currentRoutes = reactive<Array<RouteDefinition>>([])

export const useRoutes = (routes: Array<RouteDefinition>) => {
  currentRoutes.value = routes
}

const dynamicSegmentPattern = /^\[(.*)\]$/

// todo: allow children of dynamic routes, support query params, middleware

export const resolve = (path: string): ResolvedRoute | null => {
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) {
    segments.push('')
  }

  const walk = (
    routes: Array<RouteDefinition>,
    index = 0,
    ctx: RouteContext = {},
  ): ResolvedRoute | null => {
    const segment = segments.at(index) ?? ''

    for (const route of routes) {
      if (route.path === '*') {
        return { ctx, route }
      }

      const param = route.path.match(dynamicSegmentPattern)?.[1]

      if (!param && route.path !== segment) {
        continue
      }

      const nextCtx = param ? { ...ctx, [param]: segment } : ctx
      const isLast = index === segments.length - 1

      if (isLast) {
        return { ctx: nextCtx, route }
      }

      if (!route.children) {
        continue
      }

      const resolved = walk(route.children, index + 1, nextCtx)

      if (resolved) {
        return resolved
      }
    }

    return null
  }

  return walk(currentRoutes.value)
}

export const currentPath = reactive(location.pathname)
export const currentRoute = derived(() => resolve(currentPath.value))

addEventListener('popstate', () => {
  currentPath.value = location.pathname
})

export const go = (path: string) => {
  currentPath.value = path
  history.pushState(null, '', path)
}

export const back = () => {
  history.back()
}

export const isActivePath = (path: string): boolean => {
  const resolved = resolve(path)

  if (!currentRoute.value || !resolved) {
    return false
  }

  const walk = (route: RouteDefinition): boolean =>
    route === currentRoute.value?.route || !!route.children?.some(walk)

  return walk(resolved.route)
}
