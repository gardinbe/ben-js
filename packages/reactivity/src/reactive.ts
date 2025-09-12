import { subscribe, subscriptions } from './subscriptions';

/**
 * Represents a reactive.
 * @template T Value type.
 */
export type Reactive<T = unknown> = {
  readonly [ReactiveSymbol]: true;
  value: T;
};

/**
 * Symbol to identify reactives.
 */
export const ReactiveSymbol = Symbol('ben-js.reactive');

/**
 * Checks if the provided value is a reactive value.
 * @param value Value to check.
 * @returns True if the provided value is a reactive value.
 */
export const isReactive = (value: unknown): value is Reactive =>
  typeof value === 'object' && !!value && ReactiveSymbol in value;

/**
 * Creates a reactive value.
 * @param value Initial value.
 * @returns Reactive value.
 */
export const reactive = <T>(value: T): Reactive<T> => {
  let currentValue: T = value;

  return {
    [ReactiveSymbol]: true,
    get value(): T {
      track(this);
      return currentValue;
    },
    set value(next) {
      currentValue = next;
      trigger(this);
    },
  };
};

/**
 * Represents a function with reactive side effects.
 */
export type Effect = () => void;

let activeEffect: Effect | null = null;

/**
 * Subscribes the active effect to the provided reactive value.
 * @param rx Reactive value to subscribe to.
 */
export const track = (rx: Reactive): void => {
  if (!activeEffect) {
    return;
  }

  subscribe(rx, activeEffect);
};

/**
 * Triggers the effects subscribed to the provided reactive value.
 * @param rx Reactive value to trigger effects for.
 */
export const trigger = (rx: Reactive): void => {
  const subscribers = subscriptions.get(rx);
  const effect = activeEffect;
  activeEffect = null;
  subscribers?.forEach((subscriber) => {
    subscriber();
  });
  activeEffect = effect;
};

/**
 * Creates a context which tracks reactive side effects.
 * @param effect Function with reactive side effects.
 */
export const ctx = (effect: Effect): void => {
  activeEffect = effect;
  effect();
  activeEffect = null;
};
