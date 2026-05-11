import { type Reactive } from '@ben-js/reactivity';
import { type Component } from '../component';
import { Dynamic } from './Dynamic';

export const AnonList = (items: (() => Component[]) | Reactive<Component[]>): Component =>
  Dynamic({
    items,
    transform: (item) => item,
    diff: {
      removeOld: () => () => true,
      addNew: () => () => true,
    },
  });
