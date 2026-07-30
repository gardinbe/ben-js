import { type Enum } from '@ben-js/common'

export type InstanceSymbol = Enum<typeof InstanceSymbol>
export const InstanceSymbol = {
  COMPONENT: Symbol('ben-js.component'),
  REF: Symbol('ben-js.ref'),
  STATIC_VALUE: Symbol('ben-js.static-value'),
} as const
