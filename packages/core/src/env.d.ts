export type BenJsDevelopmentFlag = boolean

declare global {
  const __DEV__: BenJsDevelopmentFlag // oxlint-disable-line eslint/no-underscore-dangle
}
