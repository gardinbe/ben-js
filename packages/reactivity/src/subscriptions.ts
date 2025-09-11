import { type Reactive } from './reactive';

/**
 * Represents a function with reactive side effects.
 */
export type Effect = () => void;

/**
 * Weak map of all active subscriptions.
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
