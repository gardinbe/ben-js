import { reactive } from '@ben-js/reactivity'

import { type Component } from '../primitives/component'
import { Swap } from './Swap'

export const Suspended = (
  component: Component | PromiseLike<Component>,
  fallback?: Component,
): Component => {
  const rx = reactive<Component | null>(fallback ?? null)

  if (fallback) {
    rx.value = fallback
  }

  void (async () => {
    const resolvedComponent = await component
    rx.value = resolvedComponent
  })()

  return Swap(() => rx.value ?? null)
}
