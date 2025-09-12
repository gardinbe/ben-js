import { type Reactive, reactive, watch } from '@ben-js/reactivity';
import { equalListeners } from './_internal/utils/same-listener';
import { type EventMap, type Listener } from './types/listener';

/**
 * Represents a reactive element reference.
 * @template E - Type of the element.
 */
export type Ref<E extends HTMLElement = HTMLElement> = {
  /**
   * Current element reference.
   */
  readonly el: Reactive<E | null>;

  /**
   * Attaches an event listener to the element.
   * @param type - Event type.
   * @param callback - Event handler.
   * @param options - Event listener options.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  readonly on: EventListenerBinder<E>;

  /**
   * Removes an event listener from the element.
   * @param type - Event type.
   * @param callback - Event handler.
   * @param options - Event listener options.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
   */
  readonly off: EventListenerBinder<E>;

  /**
   * @internal
   */
  readonly [RefSymbol]: true;
};

/**
 * Represents a function that binds an event listener to an element.
 * @template E - Type of the element.
 */
export type EventListenerBinder<E extends HTMLElement> = <
  TMap extends EventMap<E> = EventMap<E>,
  TType extends keyof TMap & string = keyof TMap & string
>(
  type: TType,
  callback: (this: E, ev: TMap[TType]) => unknown,
  options?: boolean | AddEventListenerOptions
) => void;

/**
 * Symbol to identify refs.
 */
export const RefSymbol = Symbol('ben-js.ref');

/**
 * Checks if the provided value is a ref.
 * @param value - Value to check.
 * @returns True if the provided value is a ref.
 */
export const isRef = (value: unknown): value is Ref =>
  typeof value === 'object' && !!value && RefSymbol in value;

/**
 * Creates and returns a reactive element reference.
 * @returns Element reference.
 */
export const ref = <E extends HTMLElement = HTMLElement>(): Ref<E> => {
  const el: Ref<E>['el'] = reactive(null);
  const listeners: Listener[] = [];

  const on: Ref<E>['on'] = (type, callback, options) => {
    const listener: Listener = { type, callback, options };
    const exists = isSet(listener);

    if (exists) {
      return;
    }

    el.value?.addEventListener(type, callback as EventListener, options);
    listeners.push(listener);
  };

  const off: Ref<E>['off'] = (type, callback, options) => {
    const listener: Listener = { type, callback, options };
    const exists = isSet(listener);

    if (!exists) {
      return;
    }

    el.value?.removeEventListener(type, callback as EventListener, options);
    listeners.splice(listeners.indexOf(listener), 1);
  };

  /**
   * Checks if a listener is already set.
   * @param listener - Listener to check.
   * @returns True if the listener is already set.
   * @internal
   */
  const isSet = (listener: Listener): boolean => listeners.some((p) => equalListeners(p, listener));

  watch(el, (next, prev) => {
    if (prev) {
      listeners.forEach((listener) =>
        prev.removeEventListener(listener.type, listener.callback, listener.options)
      );
    }

    if (next) {
      listeners.forEach((listener) =>
        next.addEventListener(listener.type, listener.callback, listener.options)
      );
    }
  });

  return {
    el,
    on,
    off,
    [RefSymbol]: true
  };
};
