import { type Pojo } from '@ben-js/common'
import {
  derived,
  isReactive,
  type Reactive,
  type ReadonlyReactive,
} from '@ben-js/reactivity'

import { InstanceSymbol } from '../internal/instance'

export type Prop<T> = Reactive<T> | T

export type Props<T = Pojo> = {
  [K in keyof T]: T[K] extends undefined
    ? undefined
    : Prop<Exclude<T[K], undefined>>
}

export const attrs = (obj: Pojo): string | Reactive<string> => {
  const create = () =>
    Object.entries(obj)
      .map(([key, value]) => [
        key,
        isReactive(value) || isStaticValue(value) ? value.value : value,
      ])
      .filter(([, value]) => value !== undefined)
      // oxlint-disable-next-line typescript/no-base-to-string typescript/restrict-template-expressions
      .map(([key, value]) => (key ? `${key}="${value}"` : key))
      .join(' ')

  if (Object.values(obj).some(isReactive)) {
    return derived(create)
  }

  return create()
}

export const staticValue = <T>(value: T): StaticValue<T> => {
  const self: StaticValueInstance<T> = {
    [InstanceSymbol.STATIC_VALUE]: true,
    value,
  }

  return self
}

export type StaticValue<T = unknown> = {
  readonly value: T
}

type StaticValueInstance<T = unknown> = {
  readonly [InstanceSymbol.STATIC_VALUE]: true
} & StaticValue<T>

export const isStaticValue = (value: unknown): value is StaticValue =>
  typeof value === 'object' && !!value && InstanceSymbol.STATIC_VALUE in value

export type NormalizedValue<T = unknown> = ReadonlyReactive<T> | StaticValue<T>

export type NormalizedValues<T = Pojo> = {
  readonly [K in keyof T]: NormalizedValue<T[K]>
}

export const normalize = <T>(props: Props<T>): NormalizedValues<T> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      isReactive(value) ? value : staticValue(value),
    ]),
  ) as NormalizedValues<T>
