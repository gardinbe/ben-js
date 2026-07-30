import { type Enum } from '@flame/common'

export type ErrorType = Enum<typeof ErrorType>
export const ErrorType = {
  COMPONENT_MARKER_MISMATCH: 'component-marker-mismatch',
  MISSING_MOUNT_NODE: 'missing-mount-node',
  MISSING_REF_TARGET: 'missing-ref-target',
} as const

const MESSAGE_PREFIX = 'Ben-js'

const messages: Record<ErrorType, string> = {
  [ErrorType.COMPONENT_MARKER_MISMATCH]: 'Component marker count mismatch',
  [ErrorType.MISSING_MOUNT_NODE]: 'Missing mount node',
  [ErrorType.MISSING_REF_TARGET]: 'Ref target element missing',
}

export const createError = (type: ErrorType) =>
  new Error(`${MESSAGE_PREFIX} → ${messages[type]}`)
