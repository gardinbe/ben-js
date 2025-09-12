// todo: fix `any`

/**
 * Represents a listener for a specific event on an element.
 * @template E Type of the element.
 * @template M Type of the event map.
 * @template V Type of the event.
 */
export type Listener<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends HTMLElement = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends EventMap<E> = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  V extends Extract<keyof M, string> = any
> = {
  type: V;
  callback: (this: E, ev: M[V]) => unknown;
  options?: boolean | AddEventListenerOptions | undefined;
};

/**
 * Represents the event map for an element.
 * @template E Type of the element.
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
