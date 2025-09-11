import { ctx, type Reactive, reactive } from './reactive';

/**
 * Represents a function that returns a value derived from reactive side effects.
 * @template T Value type.
 */
export type DerivedEffect<T = unknown> = () => T;

/**
 * Creates a reactive value derived from the provided function.
 *
 * Reactive side effects within the function will cause the reactive value to update.
 * @param effect Function with reactive side effects.
 * @returns Reactive value.
 */
export const derived = <T>(effect: DerivedEffect<T>): Reactive<T> => {
  const rx = reactive(effect());

  ctx(() => {
    rx.value = effect();
  });

  return rx;
};
