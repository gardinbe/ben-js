import {
  type CrossOrigin,
  type FetchPriority,
  type HTMLAttributes,
  type ReferrerPolicy,
} from './base'

export type HTMLBaseAttributes = {
  href?: string
  target?: string
} & HTMLAttributes

export type HTMLLinkAttributes = {
  as?: string
  crossorigin?: CrossOrigin
  fetchpriority?: FetchPriority
  href?: string
  hreflang?: string
  imagesizes?: string
  imagesrcset?: string
  integrity?: string
  media?: string
  referrerpolicy?: ReferrerPolicy
  rel?: string
  sizes?: string
  type?: string
} & HTMLAttributes

export type HTMLMetaAttributes = {
  charset?: string
  content?: string
  'http-equiv'?: string
  media?: string
  name?: string
} & HTMLAttributes

export type HTMLScriptAttributes = {
  async?: string
  crossorigin?: CrossOrigin
  defer?: string
  fetchpriority?: FetchPriority
  integrity?: string
  nomodule?: string
  referrerpolicy?: ReferrerPolicy
  src?: string
  type?: string
} & HTMLAttributes

export type HTMLStyleAttributes = {
  blocking?: string
  media?: string
} & HTMLAttributes

export type HTMLTitleAttributes = HTMLAttributes
