import { subscribe, subscriptions } from './subscriptions'

export const reactive = <T>(value: T): Reactive<T> => {
  let currentValue: T = value

  return {
    [ReactiveSymbol]: true,
    get value(): T {
      track(this)
      return currentValue
    },
    set value(next) {
      currentValue = next
      trigger(this)
    },
  }
}

export type Reactive<T = unknown> = {
  readonly [ReactiveSymbol]: true
  value: T
}

export type ReadonlyReactive<T = unknown> = {
  readonly value: T
} & Reactive<T>

export const ReactiveSymbol = Symbol('ben-js.reactive')

export const isReactive = (value: unknown): value is Reactive =>
  typeof value === 'object' && !!value && ReactiveSymbol in value

export type Effect = () => void

let activeEffect: Effect | null = null

export const track = (rx: Reactive) => {
  if (!activeEffect) {
    return
  }

  subscribe(rx, activeEffect)
}

export const trigger = (rx: Reactive) => {
  const subscribers = subscriptions.get(rx)
  const effect = activeEffect

  activeEffect = null
  subscribers?.forEach(subscriber => {
    subscriber()
  })
  activeEffect = effect
}

export const ctx = (effect: Effect) => {
  activeEffect = effect
  effect()
  activeEffect = null
}
