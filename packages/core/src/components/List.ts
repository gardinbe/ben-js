import { type Reactive } from '@ben-js/reactivity'

import { type Component } from '../component'
import { Dynamic } from './Dynamic'

export const List = (
  items: (() => Array<KeyedComponent>) | Reactive<Array<KeyedComponent>>,
): Component =>
  Dynamic({
    diff: {
      addNew: previous => nextItem =>
        !previous.some(previousItem => previousItem.key === nextItem.key),
      removeOld: next => previousItem =>
        !next.some(nextItem => nextItem.key === previousItem.key),
    },
    items,
    transform: item => item.component,
  })

export type KeyedComponent = {
  component: Component
  key: PropertyKey
}
