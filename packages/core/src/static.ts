import { type Pojo } from '@ben-js/common'
import { type ReadonlyReactive } from '@ben-js/reactivity'

export const staticValue = <T>(value: T): Static<T> => ({
  [StaticSymbol]: true,
  value,
})

export type Static<T = unknown> = {
  readonly [StaticSymbol]: true
  readonly value: T
}

export const StaticSymbol = Symbol('ben-js.component')

export const isStatic = (value: unknown): value is Static =>
  typeof value === 'object' && !!value && StaticSymbol in value

export type NormalizedValue<T = unknown> = ReadonlyReactive<T> | Static<T>

export type NormalizedValues<T = Pojo> = {
  readonly [K in keyof T]: NormalizedValue<T[K]>
}
