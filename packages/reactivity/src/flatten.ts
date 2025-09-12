import { isReactive, type Reactive } from './reactive';

/**
 * Represents a type with reactive values flattened deeply.
 * @template T Type to flatten.
 */
export type Flattened<T> =
  T extends Reactive<infer U>
    ? Flattened<U>
    : T extends (infer A)[]
      ? Flattened<A>[]
      : T extends object
        ? { [K in keyof T]: Flattened<T[K]> }
        : T;

/**
 * Flattens an object or array by unwrapping any reactive values recursively.
 */
export const flatten = <T>(obj: Reactive<T> | T): Flattened<T> => {
  // unwrap root if it's reactive
  const target = isReactive(obj) ? obj.value : obj;

  if (Array.isArray(target)) {
    return target.map(flatten) as Flattened<T>;
  }

  if (target !== null && typeof target === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const [key, value] of Object.entries(target)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      result[key] = flatten(value);
    }
    return result as Flattened<T>;
  }

  return target as Flattened<T>;
};
