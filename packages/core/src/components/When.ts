import { derived, type Reactive } from '@flame/reactivity'

import { type Component } from '#primitives/component.ts'

import { Swap } from './Swap'

export const When = (
  condition: (() => boolean) | Reactive<boolean>,
  component: Component,
): Component => {
  const member =
    typeof condition === 'function' ? derived(condition) : condition
  return Swap(() => (member.value ? component : null))
}
