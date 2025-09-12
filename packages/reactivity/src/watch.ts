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
export type WatchFunction<T = unknown> = (next: T, prev: T) => void;

/**
 * Represents options for a watcher.
 */
export type WatchOptions = {
  immediate?: boolean;
};

/**
 * Creates a watcher for the provided reactive value.
 *
 * Executes on instantiation, and re-executes whenever the reactive value changes.
 * @param rx Reactive value to watch.
 * @param fn Function to execute.
 * @returns Watcher.
 */
export const watch = <T>(
  rx: Reactive<T>,
  fn: WatchFunction<T>,
  options?: WatchOptions,
): Watcher => {
  let value = rx.value;

  if (options?.immediate) {
    fn(value, value);
  }

  const effect = (): void => {
    fn(rx.value, value);
    value = rx.value;
  };

  const stop = (): void => {
    unsubscribe(rx, effect);
  };

  subscribe(rx, effect);

  return {
    stop,
  };
};
