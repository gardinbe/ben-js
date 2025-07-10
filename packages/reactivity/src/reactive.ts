import { subscribe, subscriptions } from './subscriptions';

/**
 * Represents a reactive.
 * @template T Type of the reactive value.
 */
export type Reactive<T = unknown> = {
  /**
   * Value of the reactive.
   */
  value: T;

  /**
   * @internal
   */
  readonly [ReactiveSymbol]: true;
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
 * Creates and returns a reactive value.
 * @param value Initial value.
 * @returns Reactive value.
 */
export const reactive = <T>(value: T): Reactive<T> => {
  let _value: T = value;

  return {
    get value() {
      track(this);
      return _value;
    },
    set value(next) {
      _value = next;
      trigger(this);
    },
    [ReactiveSymbol]: true
  };
};

/**
 * Represents a function with reactive side effects.
 */
export type Effect = () => void;

/**
 * The currently active effect.
 * @internal
 */
let activeEffect: Effect | null = null;

/**
 * Subscribes the active effect to the provided reactive value.
 * @param reactive Reactive value to subscribe to.
 */
export const track = <T extends Reactive>(reactive: T): void => {
  if (!activeEffect) {
    return;
  }

  subscribe(reactive, activeEffect);
};

/**
 * Triggers the effects subscribed to the provided reactive value.
 * @param reactive Reactive value to trigger effects for.
 */
export const trigger = <T extends Reactive>(reactive: T): void => {
  const subscribers = subscriptions.get(reactive);
  const effect = activeEffect;
  activeEffect = null;
  subscribers?.forEach((subscriber) => subscriber());
  activeEffect = effect;
};

/**
 * Creates a context which tracks reactive side effects.
 *
 * Re-executes whenever these reactive side effects are modified.
 * @param effect Function with reactive side effects.
 */
export const ctx = (effect: Effect): void => {
  // todo: it seems that these ctx functions are being called a lot
  // atleast for Refs... look into that

  activeEffect = effect;
  effect();
  activeEffect = null;
};
