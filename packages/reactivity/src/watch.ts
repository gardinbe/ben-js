import { type Reactive } from './reactive';
import { subscribe, unsubscribe } from './subscriptions';

/**
 * Represents a watcher.
 */
export type Watcher = {
  stop: () => void;
};

/**
 * Represents a function that executes whenever a reactive value changes.
 * @template T Value type.
 */
export type WatchFunction<T = unknown, TPrevious = T> = (next: T, prev: T | TPrevious) => void;

/**
 * Represents options for a watcher.
 */
export type WatchOptions = {
  /**
   * Whether to invoke the watch function immediately after creation.
   * @default false
   */
  immediate?: boolean;
};

/**
 * Creates a watcher for the provided reactive value.
 * @param rx Reactive value to watch.
 * @param fn Function to execute.
 * @returns Watcher.
 */
export const watch = <T, O extends WatchOptions>(
  rx: Reactive<T>,
  fn: WatchFunction<T, O extends { immediate: true } ? null : never>,
  options?: O,
): Watcher => {
  const effect = (): void => {
    fn(rx.value, value);
    value = rx.value;
  };

  const stop = (): void => {
    unsubscribe(rx, effect);
  };

  let value = rx.value;

  if (options?.immediate) {
    fn(value, null as T);
  }

  subscribe(rx, effect);

  return {
    stop,
  };
};
