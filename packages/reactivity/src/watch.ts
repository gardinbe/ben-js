import { type Reactive } from './reactive';
import { unsubscribe, subscribe } from './subscriptions';

/**
 * Represents a function that executes whenever the reactive value is modified.
 * @template T - Type of the reactive value.
 */
export type WatchFunction<T = unknown> = (next: T, prev: T) => void;

/**
 * Represents a watcher.
 */
export type Watcher = {
  readonly stop: () => void;
};

// todo: consider options object with immediate option

/**
 * Creates and returns a watcher that watches the provided reactive value.
 *
 * Executes on instantiation, and re-executes whenever the reactive value is modified.
 * @param reactive - Reactive value to watch.
 * @param fn - Function to execute.
 * @returns Watcher.
 */
export const watch = <T>(reactive: Reactive<T>, fn: WatchFunction<T>): Watcher => {
  let value = reactive.value;
  fn(value, value);

  const effect = () => {
    fn(reactive.value, value);
    value = reactive.value;
  };

  const stop = () => {
    unsubscribe(reactive, effect);
  };

  subscribe(reactive, effect);

  return {
    stop
  };
};
