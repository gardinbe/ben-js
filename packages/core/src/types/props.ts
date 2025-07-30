import type { Reactive } from '@ben-js/reactivity';

/**
 * Represents a property that may be reactive.
 * @template T Type of the value.
 */
export type Prop<T> = T | Reactive<T>;

/**
 * Represents an object with properties that may be reactive.
 * @template T Type of the object.
 */
export type Props<T> = {
  [K in keyof T]: Prop<T[K]>;
};
