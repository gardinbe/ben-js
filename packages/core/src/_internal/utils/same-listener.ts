import { type Listener } from '../../types/listener';

/**
 * Checks if two event listeners are equal based on type, callback, and capture flag.
 * @param a First event listener.
 * @param b Second event listener.
 * @returns True if the event listeners are equal.
 * @internal
 */
export const equalListeners = (a: Listener, b: Listener): boolean =>
  a.type === b.type && a.callback === b.callback && capture(a.options) === capture(b.options);

/**
 * Checks if an event listener has a capture flag.
 * @param options Event listener options.
 * @returns True if the event listener has a capture flag.
 * @internal
 */
const capture = (options: Listener['options']) =>
  typeof options === 'object' ? !!options.capture : !!options;
