import { type Effect, type Reactive } from './reactive';

/**
 * Weak map of all subscriptions to reactive values.
 */
export const subscriptions = new WeakMap<Reactive, Set<Effect>>();

/**
 * Subscribes the provided effect to the provided reactive value.
 * @param reactive Reactive value to subscribe to.
 * @param effect Function with reactive side effects.
 */
export const subscribe = <T>(reactive: Reactive<T>, effect: Effect): void => {
  let subscribers = subscriptions.get(reactive);

  if (!subscribers) {
    subscribers = new Set();
    subscriptions.set(reactive, subscribers);
  }

  subscribers.add(effect);
};

/**
 * Unsubscribes the provided effect from the provided reactive value.
 * @param reactive Reactive value to unsubscribe from.
 * @param effect Function with reactive side effects.
 */
export const unsubscribe = (reactive: Reactive, effect: Effect): void => {
  const subscribers = subscriptions.get(reactive);
  subscribers?.delete(effect);
};
