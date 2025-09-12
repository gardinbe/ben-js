import type { Reactive } from '../reactive';

/**
 * Represents a value that may be reactive.
 * @template T - Type of the value.
 */
export type MaybeReactive<T> = T | Reactive<T>;

/**
 * Represents an object where each property may be reactive.
 * @template T - Type of the object.
 */
export type MaybeReactiveObject<T> = {
  [K in keyof T]: MaybeReactive<T[K]>;
};
