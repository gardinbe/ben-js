import { type Effect, type Reactive } from './reactive';

/**
 * Weak map of all subscriptions to reactive values.
 */
export const subscriptions = new WeakMap<Reactive, Set<Effect>>();

/**
 * Subscribes the provided effect to the provided reactive value.
 * @param rx Reactive value to subscribe to.
 * @param effect Function with reactive side effects.
 */
export const subscribe = <T>(rx: Reactive<T>, effect: Effect): void => {
  let subscribers = subscriptions.get(rx);

  if (!subscribers) {
    subscribers = new Set();
    subscriptions.set(rx, subscribers);
  }

  subscribers.add(effect);
};

/**
 * Unsubscribes the provided effect from the provided reactive value.
 * @param rx Reactive value to unsubscribe from.
 * @param effect Function with reactive side effects.
 */
export const unsubscribe = (rx: Reactive, effect: Effect): void => {
  const subscribers = subscriptions.get(rx);
  subscribers?.delete(effect);
};
