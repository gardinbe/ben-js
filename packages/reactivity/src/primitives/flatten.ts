import { isReactive, type Reactive } from './reactive'

export const flatten = <T>(input: Reactive<T> | T): Flattened<T> => {
  const value = isReactive(input) ? input.value : input

  if (Array.isArray(value)) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return value.map(flatten) as Flattened<T>
  }

  if (value && typeof value === 'object') {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, flatten(child)]),
    ) as Flattened<T>
  }

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  return value as Flattened<T>
}

export type Flattened<T> =
  T extends Reactive<infer U>
    ? Flattened<U>
    : T extends ReadonlyArray<infer A>
      ? Array<Flattened<A>>
      : T extends object
        ? { [K in keyof T]: Flattened<T[K]> }
        : T
