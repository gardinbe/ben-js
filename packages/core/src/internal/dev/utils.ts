import { type Enum } from '@flame/common'

import { type Component } from '../../primitives/component'

type ComponentDebugInfo = {
  readonly color: string
  readonly kind: ComponentType
  readonly name: string
  readonly getChildren: () => Array<Component>
}

export const componentDebugInfo = new WeakMap<Component, ComponentDebugInfo>()

export type ComponentType = Enum<typeof ComponentType>
export const ComponentType = {
  LIST: 'List',
  STATIC: 'Static',
  SWAP: 'Swap',
} as const

export type ComponentLifecycleEvent = Enum<typeof ComponentLifecycleEvent>
export const ComponentLifecycleEvent = {
  CONNECTED: 'connected',
  DESTROYED: 'destroyed',
  DISCONNECTED: 'disconnected',
} as const

export const addComponent = (
  component: Component,
  kind: ComponentType,
  getChildren: () => Array<Component>,
) => {
  componentDebugInfo.set(component, {
    color: randomHexColor(),
    getChildren,
    kind,
    name: captureComponentName() ?? '[anonymous]',
  })
}

const randomHexColor = () =>
  // oxlint-disable-next-line unicorn/number-literal-case
  `#${Math.floor(Math.random() * 0xff_ff_ff)
    .toString(16)
    .padStart(6, '0')}`

export const recordComponentEvent = (
  component: Component,
  event: ComponentLifecycleEvent,
) => {
  const info = componentDebugInfo.get(component)

  if (!info) {
    return
  }

  const { color, marker } = getEventMarker(event)
  console.log(
    `%c${marker} %c${info.name} (${info.kind})`,
    `color:${color}`,
    `color:${info.color}`,
  )
}

const getEventMarker = (event: ComponentLifecycleEvent) => {
  switch (event) {
    case ComponentLifecycleEvent.CONNECTED: {
      return {
        color: '#0F0',
        marker: '+',
      }
    }
    case ComponentLifecycleEvent.DESTROYED: {
      return {
        color: '#F00',
        marker: 'x',
      }
    }
    case ComponentLifecycleEvent.DISCONNECTED:
    default: {
      return {
        color: '#0FF',
        marker: '-',
      }
    }
  }
}

export const getComponentDebugInfo = (
  component: Component,
): ComponentDebugInfo => {
  const info = componentDebugInfo.get(component)

  if (!info) {
    throw new Error('Flame → Component debug info is unavailable')
  }

  return info
}

const captureComponentName = (): string | null => {
  // oxlint-disable-next-line unicorn/error-message
  const stack = new Error().stack

  if (!stack) {
    return null
  }

  const names = stack
    .split('\n')
    .slice(3)
    .map(
      line => line.match(/at\s+(?:(.*?)\s+\()?[^()]*\)?$/)?.[1]?.trim() ?? null,
    )

  let closestNamedFunction: string | null = null

  for (const name of names) {
    if (name && name !== '<anonymous>') {
      closestNamedFunction = name
      break
    }
  }

  if (!closestNamedFunction) {
    return null
  }

  const nearestName = names.at(0)

  if (!nearestName || nearestName === '<anonymous>') {
    return `${closestNamedFunction}<anonymous>`
  }

  return nearestName
}
