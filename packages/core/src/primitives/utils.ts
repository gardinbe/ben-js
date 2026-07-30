import { derived, isReactive, type Reactive } from '@ben-js/reactivity'

import { isStaticValue } from './props'

export const cn = (...classes: Array<unknown>): string | Reactive<string> => {
  const create = () =>
    classes
      .map(cls => (isReactive(cls) || isStaticValue(cls) ? cls.value : cls))
      .filter(cls => !!cls)
      .filter((cls, i, arr) => arr.indexOf(cls) === i)
      .join(' ')

  if (classes.some(isReactive)) {
    return derived(create)
  }

  return create()
}
