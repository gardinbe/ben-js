import type { HTMLAttributes } from '../types/attributes';

/**
 * Creates and returns a string of HTML attributes.
 * @param obj Object of attributes.
 * @returns String of HTML attributes.
 * @example
 * attrs({
 *   id: 'my-id',
 *   class: 'my-class',
 *   style: 'background: red;',
 * });
 * // => 'id="my-id" class="my-class" style="background: red;"'
 */
export const attrs = (obj: {
  [key in keyof HTMLAttributes]: HTMLAttributes[key];
}): string =>
  Object.entries(obj)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
