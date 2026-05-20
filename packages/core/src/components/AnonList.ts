import { type Reactive } from '@ben-js/reactivity'

import { type Component } from '../component'
import { Dynamic } from './Dynamic'

export const AnonList = (
  items: (() => Array<Component>) | Reactive<Array<Component>>,
): Component =>
  Dynamic({
    diff: {
      addNew: () => () => true,
      removeOld: () => () => true,
    },
    items,
    transform: item => item,
  })
