export type Enum<T> = T[keyof T]

export type Pojo = {
  [key: PropertyKey]: unknown
}

export type UUID = `${string}-${string}-${string}-${string}-${string}`

export const createUUID = (): UUID =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, c => {
    const r = Math.trunc(Math.random() * 16)
    // oxlint-disable-next-line no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }) as UUID
