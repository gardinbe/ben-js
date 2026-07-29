import { type Pojo } from '@ben-js/common'
import { type ReadonlyReactive } from '@ben-js/reactivity'

export const staticValue = <T>(value: T): StaticValue<T> => ({
  [StaticValueSymbol]: true,
  value,
})

export type StaticValue<T = unknown> = {
  readonly [StaticValueSymbol]: true
  readonly value: T
}

export const StaticValueSymbol = Symbol('ben-js.component') // todo: update key, enum type

export const isStaticValue = (value: unknown): value is StaticValue =>
  typeof value === 'object' && !!value && StaticValueSymbol in value

export type NormalizedValue<T = unknown> = ReadonlyReactive<T> | StaticValue<T>

export type NormalizedValues<T = Pojo> = {
  readonly [K in keyof T]: NormalizedValue<T[K]>
}
