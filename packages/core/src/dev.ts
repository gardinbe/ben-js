import { type Enum } from '@ben-js/common'

import { type Component, type ComponentDevState } from './component'
import { createError, ErrorType } from './error'

export let IS_DEV = false

export const enableDevMode = () => {
  IS_DEV = true
}

const ANONYMOUS_COMPONENT_NAME = '[anonymous]'

export const createComponentDev = (
  type: ComponentType,
  getChildren: () => Array<Component>,
): ComponentDevState | null =>
  IS_DEV
    ? {
        color: randomHexColor(),
        name: getCallerFunctionName() ?? ANONYMOUS_COMPONENT_NAME,
        type,
        get children() {
          return getChildren()
        },
      }
    : null

export const getCallerFunctionName = (): string | null => {
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

  const nearestName = names[0]

  if (!nearestName || nearestName === '<anonymous>') {
    return `${closestNamedFunction}<anonymous>`
  }

  return nearestName
}

export const printTree = (component: Component) => {
  if (!IS_DEV) {
    throw createError(ErrorType.DEV_MODE_NOT_ENABLED)
  }

  const lines: Array<string> = []
  const colors: Array<string> = []

  const walk = (inner: Component, indent = '') => {
    const childIndent = `${indent}  `

    for (const child of inner.DEV!.children) {
      lines.push(`${childIndent}${child.DEV!.name}`)
      colors.push(`color:${child.DEV!.color}`)
      walk(child, childIndent)
    }
  }

  walk(component)

  console.log(lines.map(line => `%c${line}`).join('\n'), ...colors)
}

export const randomHexColor = () =>
  // oxlint-disable-next-line unicorn/number-literal-case
  `#${Math.floor(Math.random() * 0xff_ff_ff)
    .toString(16)
    .padStart(6, '0')}`

export type ComponentType = Enum<typeof ComponentType>
export const ComponentType = {
  DYNAMIC: 'Dynamic',
  STATIC: 'Static',
  SWAP: 'Swap',
} as const

export type LogEventType = Enum<typeof LogEventType>
export const LogEventType = {
  CONNECTED: 0,
  DESTROYED: 2,
  DISCONNECTED: 1,
} as const

const getLogSymbol = (type: LogEventType) => {
  switch (type) {
    case LogEventType.CONNECTED: {
      return {
        color: '#0F0',
        symbol: '➕',
      }
    }
    case LogEventType.DESTROYED: {
      return {
        color: '#F00',
        symbol: '❌',
      }
    }
    case LogEventType.DISCONNECTED:
    default: {
      return {
        color: '#0FF',
        symbol: '➖',
      }
    }
  }
}

export const logEvent = (type: LogEventType, dev: ComponentDevState | null) => {
  if (!IS_DEV || !dev) {
    return
  }

  const { color, symbol } = getLogSymbol(type)
  console.log(
    `%c${symbol} %c${dev.name} (${dev.type})`,
    `color:${color}`,
    `color:${dev.color}`,
  )
}
