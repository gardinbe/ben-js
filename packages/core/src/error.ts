import type { ComponentDevState } from './component';
import type { Enum } from './utils';

export type ErrorType = Enum<typeof ErrorType>;
export const ErrorType = {
  MISSING_MOUNT_NODE: 0,
  PARENT_IS_ORPHAN: 1,
  MISSING_REF_TARGET: 2,
  COMPONENT_MARKER_MISMATCH: 3,
  DEV_MODE_NOT_ENABLED: 4,
} as const;

const MSG_PREFIX = 'Ben-js';

export const createError = (type: ErrorType, DEV?: ComponentDevState | null) =>
  new Error(MSG_PREFIX + ' → ' + createErrorMsg(type, DEV?.name));

const createErrorMsg = (type: ErrorType, name?: string) => {
  // todo: tidy

  if (name) {
    switch (type) {
      case ErrorType.MISSING_MOUNT_NODE:
        return `Missing mount node for ${name}`;
      case ErrorType.PARENT_IS_ORPHAN:
        return `Mount node for ${name} is an orphan`;
      case ErrorType.MISSING_REF_TARGET:
        return `Ref target element missing on ${name}`;
      case ErrorType.COMPONENT_MARKER_MISMATCH:
        return `Component marker count mismatch on ${name}`;
    }
  }

  switch (type) {
    case ErrorType.MISSING_MOUNT_NODE:
      return 'Missing mount node';
    case ErrorType.PARENT_IS_ORPHAN:
      return 'Mount node is an orphan';
    case ErrorType.MISSING_REF_TARGET:
      return 'Ref target element missing';
    case ErrorType.COMPONENT_MARKER_MISMATCH:
      return 'Component marker count mismatch';
    case ErrorType.DEV_MODE_NOT_ENABLED:
      return 'You must enable dev mode with `enableDevMode()` to perform this action';
  }
};
