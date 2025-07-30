/**
 * Returns the string representation of the provided value.
 * @param value Value to stringify.
 * @returns Stringified value.
 * @internal
 */
export const stringify = (value: unknown): string =>
  value != null ? (value as object).toString() : '';
