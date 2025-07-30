/**
 * Creates and returns a reactive class name string composed of the provided class names.
 * @param classes Class names.
 * @returns Reactive class name string.
 * @example
 * cn('my-class', null, false, 'my-other-class');
 * // => 'my-class my-other-class'
 */
export const cn = (...classes: unknown[]): string =>
  classes
    .map((cls) => cls)
    .filter((cls) => !!cls)
    .filter((cls, i, arr) => arr.indexOf(cls) === i)
    .join(' ');
