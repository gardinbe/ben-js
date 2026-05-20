import { type Enum } from '@ben-js/common'

import { type ComponentDevState } from './component'

export const ErrorType = {
  COMPONENT_MARKER_MISMATCH: 2,
  DEV_MODE_NOT_ENABLED: 3,
  MISSING_MOUNT_NODE: 0,
  MISSING_REF_TARGET: 1,
} as const

export type ErrorType = Enum<typeof ErrorType>

const PREFIX = 'Ben-js'

const messages: Record<ErrorType, string> = {
  [ErrorType.COMPONENT_MARKER_MISMATCH]: 'Component marker count mismatch',
  [ErrorType.DEV_MODE_NOT_ENABLED]:
    'You must enable dev mode with `enableDevMode()` to perform this action',
  [ErrorType.MISSING_MOUNT_NODE]: 'Missing mount node',
  [ErrorType.MISSING_REF_TARGET]: 'Ref target element missing',
}

export const createError = (type: ErrorType, dev?: ComponentDevState | null) =>
  new Error(`${PREFIX} → ${createErrorMsg(type, dev?.name)}`)

const createErrorMsg = (type: ErrorType, name?: string) => {
  const message = messages[type]

  if (!name) {
    return message
  }

  return `${message} on ${name}`
}
