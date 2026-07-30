import { type Pojo } from '@ben-js/common'
import { type ReadonlyReactive } from '@ben-js/reactivity'

import { InstanceSymbol } from '../internal/instance'

export const staticValue = <T>(value: T): StaticValue<T> => ({
  [InstanceSymbol.STATIC_VALUE]: true,
  value,
})

export type StaticValue<T = unknown> = {
  readonly [InstanceSymbol.STATIC_VALUE]: true
  readonly value: T
}

export const isStaticValue = (value: unknown): value is StaticValue =>
  typeof value === 'object' && !!value && InstanceSymbol.STATIC_VALUE in value

export type NormalizedValue<T = unknown> = ReadonlyReactive<T> | StaticValue<T>

export type NormalizedValues<T = Pojo> = {
  readonly [K in keyof T]: NormalizedValue<T[K]>
}
