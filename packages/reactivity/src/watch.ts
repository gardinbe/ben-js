import { type Reactive } from './reactive';
import { subscribe, unsubscribe } from './subscriptions';

export const watch: Watch = <T>(
  rx: Reactive<T>,
  fn: WatchFunction<T, T | null>,
  options?: WatchOptions,
): Watcher => {
  let value = rx.value;

  const effect = (): void => {
    fn(rx.value, value);
    value = rx.value;
  };

  const stop = (): void => {
    unsubscribe(rx, effect);
  };

  if (options?.immediate) {
    fn(value, null);
  }

  subscribe(rx, effect);

  return {
    stop,
  };
};

export type Watch = {
  <T>(rx: Reactive<T>, fn: WatchFunction<T, T | null>, options: WatchImmediateOptions): Watcher;
  <T>(rx: Reactive<T>, fn: WatchFunction<T>, options?: WatchOptions): Watcher;
};

export type Watcher = {
  stop: () => void;
};

export type WatchFunction<TNext, TPrev = TNext> = (next: TNext, prev: TPrev) => void;

export type WatchOptions = {
  immediate?: boolean;
};

export type WatchImmediateOptions = WatchOptions & {
  immediate: true;
};
