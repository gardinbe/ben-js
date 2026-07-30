import { type Enum } from '@flame/common'

export const ErrorType = {
  MISSING_ROUTE: 'missing-route',
} as const

export type ErrorType = Enum<typeof ErrorType>

const PREFIX = 'Ben-js/router'

const messages: Record<ErrorType, string> = {
  [ErrorType.MISSING_ROUTE]: 'No route resolved',
}

export const createError = (type: ErrorType) =>
  new Error(`${PREFIX} → ${messages[type]}`)
