export type Enum<T> = T[keyof T]

export type Pojo = {
  [key: PropertyKey]: unknown
}
