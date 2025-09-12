// todo: fix `any`

/**
 * Represents a listener for a specific event on an element.
 * @template TElement - Type of the element.
 * @template TMap - Type of the event map.
 * @template TEvent - Type of the event.
 */
export type Listener<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TElement extends HTMLElement = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMap extends EventMap<TElement> = any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TEvent extends Extract<keyof TMap, string> = any
> = {
  type: TEvent;
  callback: (this: TElement, ev: TMap[TEvent]) => unknown;
  options?: boolean | AddEventListenerOptions | undefined;
};

/**
 * Represents the event map for an element.
 * @template E - Type of the element.
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
