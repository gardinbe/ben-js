import { type Reactive, reactive, watch } from '@ben-js/reactivity';

import { createUUID, type UUID } from './utils';

/**
 * Represents a function that binds an event listener to an element.
 * @template E Element type.
 */
export type EventListenerBinder<E extends HTMLElement> = <
  TMap extends EventMap<E> = EventMap<E>,
  TType extends keyof TMap & string = keyof TMap & string,
>(
  type: TType,
  callback: (this: E, ev: TMap[TType]) => unknown,
  options?: AddEventListenerOptions | boolean,
) => void;

/**
 * Represents a reactive element reference.
 * @template E Element type.
 */
export type Ref<E extends HTMLElement = HTMLElement> = {
  /**
   * Current element reference.
   */
  el: Reactive<E | null>;

  /**
   * Removes an event listener from the element.
   * @param type Event type.
   * @param callback Event handler.
   * @param options Event listener options.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener
   */
  off: EventListenerBinder<E>;

  /**
   * Attaches an event listener to the element.
   * @param type Event type.
   * @param callback Event handler.
   * @param options Event listener options.
   * @see https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
   */
  on: EventListenerBinder<E>;

  readonly [RefSymbol]: true;

  /**
   * Unique identifier.
   */
  uuid: UUID;
};

/**
 * Symbol to identify refs.
 */
export const RefSymbol = Symbol('ben-js.ref');

/**
 * Checks if the provided value is a ref.
 * @param value Value to check.
 * @returns True if the provided value is a ref.
 */
export const isRef = (value: unknown): value is Ref =>
  typeof value === 'object' && !!value && RefSymbol in value;

/**
 * Creates a reactive element reference.
 * @returns Element reference.
 */
export const ref = <E extends HTMLElement = HTMLElement>(): Ref<E> => {
  const uuid = createUUID();
  const el: Ref<E>['el'] = reactive(null);
  const listeners: Listener[] = [];

  const on: Ref<E>['on'] = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    };

    if (isSet(listener)) {
      return;
    }

    el.value?.addEventListener(type, callback as EventListener, options);
    listeners.push(listener);
  };

  const off: Ref<E>['off'] = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    };

    if (!isSet(listener)) {
      return;
    }

    el.value?.removeEventListener(type, callback as EventListener, options);
    listeners.splice(listeners.indexOf(listener), 1);
  };

  const isSet = (listener: Listener): boolean => listeners.some((p) => isSameListener(p, listener));

  watch(
    el,
    (next, prev) => {
      if (prev) {
        listeners.forEach((listener) => {
          prev.removeEventListener(listener.type, listener.callback, listener.options);
        });
      }

      if (next) {
        listeners.forEach((listener) => {
          next.addEventListener(listener.type, listener.callback, listener.options);
        });
      }
    },
    {
      immediate: true,
    },
  );

  return {
    el,
    off,
    on,
    [RefSymbol]: true,
    uuid,
  };
};

/**
 * Represents the event map for an element.
 * @template E Element type.
 */
export type EventMap<E extends Element> = E extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : E extends HTMLMediaElement
    ? HTMLMediaElementEventMap
    : E extends HTMLBodyElement
      ? HTMLBodyElementEventMap
      : E extends HTMLFrameSetElement
        ? HTMLFrameSetElementEventMap
        : E extends SVGElement
          ? SVGElementEventMap
          : E extends HTMLElement
            ? HTMLElementEventMap
            : E extends Element
              ? ElementEventMap
              : never;

/**
 * Represents a listener for a specific event on an element.
 * @template E Element type.
 * @template TEventMap Event map type.
 * @template TEvent Event type.
 */
export type Listener<
  E extends HTMLElement = HTMLElement,
  TEventMap extends EventMap<E> = EventMap<E>,
  TEvent extends Extract<keyof TEventMap, string> = Extract<keyof TEventMap, string>,
> = {
  callback: (this: E, ev: TEventMap[TEvent]) => unknown;
  options?: AddEventListenerOptions | boolean | undefined;
  type: TEvent;
};

const isSameListener = (a: Listener, b: Listener): boolean =>
  a.type === b.type &&
  a.callback === b.callback &&
  isListenerCapture(a.options) === isListenerCapture(b.options);

const isListenerCapture = (options: Listener['options']): boolean =>
  typeof options === 'object' ? !!options.capture : !!options;
