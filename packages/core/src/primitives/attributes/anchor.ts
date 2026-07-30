import { type HTMLAttributes, type ReferrerPolicy, type Target } from './base'

export type HTMLAnchorAttributes = {
  href: string
  download?: string
  hreflang?: string
  ping?: string
  referrerpolicy?: ReferrerPolicy
  rel?: string
  target?: Target
  type?: string
} & HTMLAttributes

export type HTMLAreaAttributes = {
  alt?: string
  coords?: string
  download?: string
  href?: string
  ping?: string
  referrerpolicy?: ReferrerPolicy
  rel?: string
  shape?: 'circle' | 'default' | 'poly' | 'rect'
  target?: Target
} & HTMLAttributes

export type HTMLMapAttributes = {
  name?: string
} & HTMLAttributes
