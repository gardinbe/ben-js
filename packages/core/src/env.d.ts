export type FlameDevelopmentFlag = boolean

declare global {
  const __DEV__: FlameDevelopmentFlag // oxlint-disable-line eslint/no-underscore-dangle
}
