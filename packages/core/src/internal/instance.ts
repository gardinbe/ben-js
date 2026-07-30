import { type Enum } from '@flame/common'

export type InstanceSymbol = Enum<typeof InstanceSymbol>
export const InstanceSymbol = {
  COMPONENT: Symbol('flame.component'),
  REF: Symbol('flame.ref'),
  STATIC_VALUE: Symbol('flame.static-value'),
} as const
