import { derived, isReactive, type Reactive } from '@ben-js/reactivity';

/**
 * Represents a plain old JavaScript object.
 */
export type Pojo = {
  [key: PropertyKey]: unknown;
};

/**
 * Represents a UUID.
 */
export type UUID = ReturnType<typeof crypto.randomUUID>;

/**
 * Creates a reactive HTML attributes string derived from the provided attributes object.
 * @param obj Object of attributes.
 * @returns Reactive HTML attributes string.
 * @example
 * attributes({
 *   id: 'my-id',
 *   class: 'my-class',
 *   style: 'background: red;',
 * });
 * // id='my-id' class='my-class' style='background: red;'
 */
export const attributes = (obj: Pojo): Reactive<string> =>
  derived(() =>
    Object.entries(obj)
      .map(([key, value]) => [key, isReactive(value) ? value.value : value])
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => (key ? `${key}='${value}'` : key))
      .join(' '),
  );

/**
 * Creates a reactive class name string derived from the provided class names.
 * @param classes Class names.
 * @returns Reactive class name string.
 * @example
 * cn('my-class', null, false, 'my-other-class');
 * // my-class my-other-class
 */
export const cn = (...classes: unknown[]): Reactive<string> =>
  derived(() =>
    classes
      .map((cls) => (isReactive(cls) ? cls.value : cls))
      .filter((cls) => !!cls)
      .filter((cls, i, arr) => arr.indexOf(cls) === i)
      .join(' '),
  );
