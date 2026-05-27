import { type Enum } from '@ben-js/common'

import { type ComponentDevState } from './component'

export type ErrorType = Enum<typeof ErrorType>
export const ErrorType = {
  COMPONENT_MARKER_MISMATCH: 'component-marker-mismatch',
  DEV_MODE_NOT_ENABLED: 'dev-mode-not-enabled',
  MISSING_MOUNT_NODE: 'missing-mount-node',
  MISSING_REF_TARGET: 'missing-ref-target',
} as const

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
