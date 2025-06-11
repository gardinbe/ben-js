import { derived, isReactive, type Derived } from '@ben-js/reactivity';

/**
 * Creates and returns a reactive class name string composed of the provided class names.
 * @param classes - Class names.
 * @returns Reactive class name string.
 * @example
 * cn('my-class', null, false, 'my-other-class');
 * // => 'my-class my-other-class'
 */
export const cn = (...classes: unknown[]): Derived<string> =>
  derived(() =>
    [...new Set(classes)]
      .map((cls) => (isReactive(cls) ? cls.value : cls))
      .filter((cls) => !!cls)
      .join(' ')
  );
