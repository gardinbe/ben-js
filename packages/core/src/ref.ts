import { reactive, watch } from '@ben-js/reactivity';

import { createUUID, type UUID } from './utils';

export const ref = <E extends HTMLElement = HTMLElement>(): Ref<E> => {
  const uuid = createUUID();
  const element = reactive<E | null>(null);
  const listeners: Listener[] = [];

  const on: EventListenerBinder<E> = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    };

    if (isSet(listener)) {
      return;
    }

    element.value?.addEventListener(type, callback as EventListener, options);
    listeners.push(listener);
  };

  const off: EventListenerBinder<E> = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    };

    if (!isSet(listener)) {
      return;
    }

    element.value?.removeEventListener(type, callback as EventListener, options);
    listeners.splice(listeners.indexOf(listener), 1);
  };

  const isSet = (listener: Listener): boolean => listeners.some((p) => isSameListener(p, listener));

  watch(
    element,
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
    get el() {
      return element.value;
    },
    off,
    on,
    [RefSymbol]: true,
    uuid,
    set: (el) => {
      element.value = el;
    },
  };
};

export interface Ref<E extends HTMLElement = HTMLElement> {
  readonly [RefSymbol]: true;
  readonly el: E | null;
  readonly uuid: UUID;
  readonly on: EventListenerBinder<E>;
  readonly off: EventListenerBinder<E>;
  readonly set: (element: E | null) => void;
}

export const RefSymbol = Symbol('ben-js.ref');

export const isRef = (value: unknown): value is Ref =>
  typeof value === 'object' && !!value && RefSymbol in value;

export type EventListenerBinder<E extends HTMLElement> = <
  TMap extends EventMap<E> = EventMap<E>,
  TType extends keyof TMap & string = keyof TMap & string,
>(
  type: TType,
  callback: (this: E, ev: TMap[TType]) => unknown,
  options?: AddEventListenerOptions | boolean,
) => void;

export type EventMap<E extends Element> = E extends HTMLVideoElement
  ? HTMLVideoElementEventMap
  : E extends HTMLMediaElement
    ? HTMLMediaElementEventMap
    : E extends HTMLBodyElement
      ? HTMLBodyElementEventMap
      : // eslint-disable-next-line @typescript-eslint/no-deprecated
        E extends HTMLFrameSetElement
        ? HTMLFrameSetElementEventMap
        : E extends SVGElement
          ? SVGElementEventMap
          : E extends HTMLElement
            ? HTMLElementEventMap
            : E extends Element
              ? ElementEventMap
              : never;

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
