import { ctx, type Reactive, reactive } from './reactive';

/**
 * Represents a derived reactive.
 * @template T Value type.
 */
export type Derived<T = unknown> = Omit<Reactive<T>, 'value'> &
  Readonly<Pick<Reactive<T>, 'value'>>;

/**
 * Represents a function that returns a value derived from reactive side effects.
 * @template T Value type.
 */
export type DerivedEffect<T = unknown> = (prev?: T) => T;

/**
 * Creates a context which tracks reactive side effects, and returns a new reactive value derived
 * from these effects.
 *
 * Re-executes whenever these reactive side effects are modified, re-evaluating the returned
 * reactive value.
 * @param effect Function with reactive side effects.
 * @returns Reactive value.
 */
export const derived = <T>(effect: DerivedEffect<T>): Derived<T> => {
  let value: T = effect();
  const r = reactive(value);

  ctx(() => {
    const newValue = effect(value);
    r.value = newValue;
    value = newValue;
  });

  return r;
};
