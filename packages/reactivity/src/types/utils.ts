import type { Reactive } from '../reactive';

/**
 * Represents a value that may be reactive.
 * @template T Type of the value.
 */
export type MaybeReactive<T> = T | Reactive<T>;
