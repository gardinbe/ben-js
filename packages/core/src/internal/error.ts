import { type Enum } from '@flame/common'

export type ErrorType = Enum<typeof ErrorType>
export const ErrorType = {
  DEBUG_UNAVAILABLE: 'debug-unavailable',
  MISSING_MOUNT_NODE: 'missing-mount-node',
} as const

const MESSAGE_PREFIX = 'Flame'

const messages: Record<ErrorType, string> = {
  [ErrorType.DEBUG_UNAVAILABLE]:
    'Component debug info is unavailable. Import components from the development entrypoint',
  [ErrorType.MISSING_MOUNT_NODE]: 'Missing mount node',
}

export const createError = (type: ErrorType) =>
  new Error(`${MESSAGE_PREFIX} → ${messages[type]}`)
