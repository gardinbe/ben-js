import { type Reactive } from './reactive';
import { subscribe, unsubscribe } from './subscriptions';

/**
 * Represents a watcher.
 */
export type Watcher = {
  stop: () => void;
};

/**
 * Represents a function that executes whenever the reactive value is modified.
 * @template T Value type.
 */
export type WatchFunction<T = unknown> = (next: T, prev: T) => void;

// todo: consider options object with immediate option

/**
 * Creates and returns a watcher that watches the provided reactive value.
 *
 * Executes on instantiation, and re-executes whenever the reactive value is modified.
 * @param rx Reactive value to watch.
 * @param fn Function to execute.
 * @returns Watcher.
 */
export const watch = <T>(rx: Reactive<T>, fn: WatchFunction<T>): Watcher => {
  let value = rx.value;
  fn(value, value);

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
