import { type Enum } from './utils';

export type ErrorType = Enum<typeof ErrorType>;
export const ErrorType = {
  MISSING_ROUTE: 0,
} as const;

const MSG_PREFIX = 'Ben-js/router';

export const createError = (type: ErrorType) =>
  new Error(MSG_PREFIX + ' → ' + createErrorMsg(type));

const createErrorMsg = (type: ErrorType) => {
  switch (type) {
    case ErrorType.MISSING_ROUTE:
      return 'No route resolved';
  }
};
