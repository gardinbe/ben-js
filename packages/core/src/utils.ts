import { type Pojo } from '@ben-js/common'
import { derived, isReactive, type Reactive } from '@ben-js/reactivity'

import { isStatic, type NormalizedValues, staticValue } from './static'

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
        isReactive(value) || isStatic(value) ? value.value : value,
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

export const cn = (...classes: Array<unknown>): string | Reactive<string> => {
  const create = () =>
    classes
      .map(cls => (isReactive(cls) || isStatic(cls) ? cls.value : cls))
      .filter(cls => !!cls)
      .filter((cls, i, arr) => arr.indexOf(cls) === i)
      .join(' ')

  if (classes.some(isReactive)) {
    return derived(create)
  }

  return create()
}

export const normalize = <T>(props: Props<T>): NormalizedValues<T> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      isReactive(value) ? value : staticValue(value),
    ]),
  ) as NormalizedValues<T>
