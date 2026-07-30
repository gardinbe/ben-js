import { subscribe, subscriptions } from './subscriptions'

export const reactive = <T>(value: T): Reactive<T> => {
  let currentValue: T = value

  const self: ReactiveInstance<T> = {
    [ReactiveSymbol]: true,
    get value(): T {
      track(self)
      return currentValue
    },
    set value(next) {
      currentValue = next
      trigger(self)
    },
  }

  return self
}

export type Reactive<T = unknown> = {
  value: T
}

export type ReadonlyReactive<T = unknown> = {
  readonly value: T
}

type ReactiveInstance<T = unknown> = {
  readonly [ReactiveSymbol]: true
} & Reactive<T>

const ReactiveSymbol = Symbol('ben-js.reactive')

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
  subscribers?.forEach(subscriber => subscriber())
  activeEffect = effect
}

export const ctx = (effect: Effect) => {
  activeEffect = effect
  effect()
  activeEffect = null
}
