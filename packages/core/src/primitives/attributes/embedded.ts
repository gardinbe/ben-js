import { type HTMLAttributes, type ReferrerPolicy } from './base'

export type HTMLEmbedAttributes = {
  height?: string
  src?: string
  type?: string
  width?: string
} & HTMLAttributes

export type HTMLIFrameAttributes = {
  allow?: string
  allowfullscreen?: string
  height?: string
  loading?: 'eager' | 'lazy'
  name?: string
  referrerpolicy?: ReferrerPolicy
  sandbox?: string
  src?: string
  srcdoc?: string
  width?: string
} & HTMLAttributes

export type HTMLObjectAttributes = {
  data?: string
  form?: string
  height?: string
  name?: string
  type?: string
  width?: string
} & HTMLAttributes

export type HTMLParamAttributes = {
  name?: string
  value?: string
} & HTMLAttributes

export type HTMLPortalAttributes = {
  referrerpolicy?: ReferrerPolicy
  src?: string
} & HTMLAttributes
