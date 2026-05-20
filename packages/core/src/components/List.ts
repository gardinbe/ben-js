import { type Reactive } from '@ben-js/reactivity'

import { type Component } from '../component'
import { Dynamic } from './Dynamic'

export const List = (
  items: (() => Array<KeyedComponent>) | Reactive<Array<KeyedComponent>>,
): Component =>
  Dynamic({
    diff: {
      addNew: prev => nextItem =>
        !prev.some(prevItem => prevItem.key === nextItem.key),
      removeOld: next => prevItem =>
        !next.some(nextItem => nextItem.key === prevItem.key),
    },
    items,
    transform: item => item.component,
  })

export type KeyedComponent = {
  component: Component
  key: PropertyKey
}
