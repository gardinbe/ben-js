import { type Derived, derived, isReactive } from '@ben-js/reactivity';

import { type HTMLAttributes } from './attributes';
import { type Props } from './props';

/**
 * Represents a plain old JavaScript object.
 */
export type Pojo = {
  [key: PropertyKey]: unknown;
};

/**
 * Creates and returns a string of HTML attributes.
 * @param obj Object of attributes.
 * @returns String of HTML attributes.
 * @example
 * attributes({
 *   id: 'my-id',
 *   class: 'my-class',
 *   style: 'background: red;',
 * });
 * // => 'id="my-id" class="my-class" style="background: red;"'
 */
export const attributes = (obj: Props<HTMLAttributes>): Derived<string> =>
  derived(() =>
    Object.entries(obj)
      .filter(([, value]) => value.value !== undefined)
      .map(([key, value]) => (key ? `${key}="${value.value}"` : key))
      .join(' '),
  );

/**
 * Creates and returns a reactive class name string composed of the provided class names.
 * @param classes Class names.
 * @returns Reactive class name string.
 * @example
 * cn('my-class', null, false, 'my-other-class');
 * // => 'my-class my-other-class'
 */
export const cn = (...classes: unknown[]): Derived<string> =>
  derived(() =>
    classes
      .map((cls) => (isReactive(cls) ? cls.value : cls))
      .filter((cls) => !!cls)
      .filter((cls, i, arr) => arr.indexOf(cls) === i)
      .join(' '),
  );
