import { type Enum } from '@ben-js/common'

const COMPONENT = Symbol('ben-js.component')
const REF = Symbol('ben-js.ref')
const STATIC_VALUE = Symbol('ben-js.static-value')

export type InstanceSymbol = Enum<typeof InstanceSymbol>
export const InstanceSymbol = {
  COMPONENT,
  REF,
  STATIC_VALUE,
} as const
