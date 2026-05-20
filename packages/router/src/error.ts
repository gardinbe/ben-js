import { type Enum } from '@ben-js/common'

export const ErrorType = {
  MISSING_ROUTE: 0,
} as const

export type ErrorType = Enum<typeof ErrorType>

const PREFIX = 'Ben-js/router'

const messages: Record<ErrorType, string> = {
  [ErrorType.MISSING_ROUTE]: 'No route resolved',
}

export const createError = (type: ErrorType) =>
  new Error(`${PREFIX} → ${messages[type]}`)
