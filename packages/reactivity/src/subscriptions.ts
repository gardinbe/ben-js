import { type Reactive } from './reactive'

export type Effect = () => void

export const subscriptions = new WeakMap<Reactive, Set<Effect>>()

export const subscribe = <T>(rx: Reactive<T>, effect: Effect): void => {
  let subscribers = subscriptions.get(rx)

  if (!subscribers) {
    subscribers = new Set()
    subscriptions.set(rx, subscribers)
  }

  subscribers.add(effect)
}

export const unsubscribe = (rx: Reactive, effect: Effect): void => {
  const subscribers = subscriptions.get(rx)
  subscribers?.delete(effect)
}
