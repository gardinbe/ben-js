import { ctx, type Reactive, reactive } from './reactive';

export const derived = <T>(effect: DerivedEffect<T>): Derived<T> => {
  const rx = reactive(effect());

  ctx(() => {
    rx.value = effect();
  });

  return rx;
};

export type Derived<T> = Reactive<T> & {
  readonly value: T;
};

export type DerivedEffect<T> = () => T;
