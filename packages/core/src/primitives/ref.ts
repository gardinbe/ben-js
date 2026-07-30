import { reactive, watch } from '@ben-js/reactivity'

import { InstanceSymbol } from '../internal/instance'
import { createUUID, type UUID } from '../internal/uuid'

export const ref = <E extends HTMLElement = HTMLElement>(): Ref<E> => {
  const uuid = createUUID()
  const element = reactive<E | null>(null)
  const listeners: Array<Listener> = []

  const on: EventListenerBinder<E> = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    }

    if (isSet(listener)) {
      return
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    element.value?.addEventListener(type, callback as EventListener, options)
    listeners.push(listener)
  }

  const off: EventListenerBinder<E> = (type, callback, options) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener: Listener<any, any, any> = {
      callback,
      options,
      type,
    }

    if (!isSet(listener)) {
      return
    }

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    element.value?.removeEventListener(type, callback as EventListener, options)
    listeners.splice(listeners.indexOf(listener), 1)
  }

  const isSet = (listener: Listener): boolean =>
    listeners.some(p => isSameListener(p, listener))

  watch(
    element,
    (next, previous) => {
      if (previous) {
        listeners.forEach(listener =>
          previous.removeEventListener(
            listener.type,
            listener.callback,
            listener.options,
          ),
        )
      }

      if (next) {
        listeners.forEach(listener =>
          next.addEventListener(
            listener.type,
            listener.callback,
            listener.options,
          ),
        )
      }
    },
    {
      immediate: true,
    },
  )

  const self: RefInstance<E> = {
    [InstanceSymbol.REF]: true,
    off,
    on,
    uuid,
    get el() {
      return element.value
    },
    set: el => {
      element.value = el
    },
  }

  return self
}

export type Ref<E extends HTMLElement = HTMLElement> = {
  readonly el: E | null
  readonly off: EventListenerBinder<E>
  readonly on: EventListenerBinder<E>
  readonly uuid: UUID
  readonly set: (element: E | null) => void
}

type RefInstance<E extends HTMLElement = HTMLElement> = {
  readonly [InstanceSymbol.REF]: true
} & Ref<E>

export const isRef = (value: unknown): value is Ref =>
  typeof value === 'object' && !!value && InstanceSymbol.REF in value

export type EventListenerBinder<E extends HTMLElement> = <
  TMap extends EventMap<E> = EventMap<E>,
  TType extends string & keyof TMap = string & keyof TMap,
>(
  type: TType,
  callback: (this: E, ev: TMap[TType]) => unknown,
  options?: boolean | AddEventListenerOptions,
) => void

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
              : never

export type Listener<
  E extends HTMLElement = HTMLElement,
  TEventMap extends EventMap<E> = EventMap<E>,
  TEvent extends Extract<keyof TEventMap, string> = Extract<
    keyof TEventMap,
    string
  >,
> = {
  type: TEvent
  options?: boolean | AddEventListenerOptions | undefined
  callback: (this: E, ev: TEventMap[TEvent]) => unknown
}

const isSameListener = (a: Listener, b: Listener): boolean =>
  a.type === b.type &&
  a.callback === b.callback &&
  isListenerCapture(a.options) === isListenerCapture(b.options)

const isListenerCapture = (options: Listener['options']): boolean =>
  typeof options === 'object' ? !!options.capture : !!options
