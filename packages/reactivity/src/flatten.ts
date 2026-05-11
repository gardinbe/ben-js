import { isReactive, type Reactive } from './reactive';

export const flatten = <T>(input: Reactive<T> | T): Flattened<T> => {
  const value = isReactive(input) ? input.value : input;

  if (Array.isArray(value)) {
    return value.map(flatten) as Flattened<T>;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, flatten(child)]),
    ) as Flattened<T>;
  }

  return value as Flattened<T>;
};

export type Flattened<T> =
  T extends Reactive<infer U>
    ? Flattened<U>
    : T extends readonly (infer A)[]
      ? Flattened<A>[]
      : T extends object
        ? { [K in keyof T]: Flattened<T[K]> }
        : T;
