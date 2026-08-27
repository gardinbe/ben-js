import { derived, type Reactive, watch } from '@flame/reactivity'

import { ComponentType, addComponent } from '../internal/dev/utils'
import {
  type Component,
  createComponent,
  createComponentMembers,
} from '../primitives/component'

export const Swap = (
  item: (() => Component | null) | Reactive<Component | null>,
): Component => {
  const member = typeof item === 'function' ? derived(item) : item
  const components = () => getMemberComponents(member.value)
  const { marker, mountMember } = createComponentMembers()

  watch(member, (next, previous) => {
    if (!next || next === previous) {
      return
    }

    previous?.destroy()
    mountMember(next)
  })

  const self = createComponent({
    getChildren: components,
    marker,
    destroy: () => {
      member.value?.destroy()
      marker.remove()
    },
    mount: () => {
      if (member.value) {
        mountMember(member.value)
      }
    },
    unmount: () => {
      member.value?.unmount()
      marker.remove()
    },
  })

  if (__DEV__) {
    addComponent(self, ComponentType.SWAP, components)
  }

  return self
}

const getMemberComponents = (component: Component | null): Array<Component> =>
  component ? [component] : []
