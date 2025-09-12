import { derived, isReactive, type Reactive } from '@ben-js/reactivity';

/**
 * Creates and returns a reactive class name string composed of the provided class names.
 * @param classes - Class names.
 * @returns Reactive class name string.
 */
export const cn = (...classes: unknown[]): Reactive<string> =>
  derived(() =>
    [...new Set(classes)]
      .map((cls) => (isReactive(cls) ? cls.value : cls))
      .filter((cls) => !!cls)
      .join(' ')
  );
