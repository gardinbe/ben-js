import { type Reactive } from '@ben-js/reactivity';
import { type Component } from '../component';
import { Dynamic } from './Dynamic';

export const List = (items: (() => KeyedComponent[]) | Reactive<KeyedComponent[]>): Component =>
  Dynamic({
    items,
    transform: (item) => item.component,
    diff: {
      removeOld: (next) => (prevItem) => !next.some((nextItem) => nextItem.key === prevItem.key),
      addNew: (prev) => (nextItem) => !prev.some((prevItem) => prevItem.key === nextItem.key),
    },
  });

export type KeyedComponent = {
  component: Component;
  key: PropertyKey;
};
