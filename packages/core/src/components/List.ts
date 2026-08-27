import { derived, type Reactive, watch } from '@flame/reactivity'

import { addComponent, ComponentType } from '#internal/dev/utils.ts'
import {
  type Component,
  createComponent,
  createComponentMembers,
} from '#primitives/component.ts'

export const List = (
  items: (() => Array<KeyedComponent>) | Reactive<Array<KeyedComponent>>,
): Component => {
  const members = typeof items === 'function' ? derived(items) : items
  const components = () => members.value.map(({ component }) => component)
  const { marker, mountMember } = createComponentMembers()

  watch(members, (next, previous) => {
    previous
      .filter(
        previousItem =>
          !next.some(nextItem => nextItem.key === previousItem.key),
      )
      .forEach(({ component }) => component.destroy())

    next
      .filter(
        nextItem =>
          !previous.some(previousItem => previousItem.key === nextItem.key),
      )
      .forEach(({ component }) => mountMember(component))
  })

  const self = createComponent({
    getChildren: components,
    marker,
    destroy: () => {
      components().forEach(component => component.destroy())
      marker.remove()
    },
    mount: () => {
      components().forEach(component => mountMember(component))
    },
    unmount: () => {
      components().forEach(component => component.unmount())
      marker.remove()
    },
  })

  if (__DEV__) {
    addComponent(self, ComponentType.LIST, components)
  }

  return self
}

export type KeyedComponent = {
  component: Component
  key: PropertyKey
}
