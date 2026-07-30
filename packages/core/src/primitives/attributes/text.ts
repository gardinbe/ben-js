import { type HTMLAttributes } from './base'

export type HTMLBRElementAttributes = HTMLAttributes

export type HTMLDataAttributes = {
  value?: string
} & HTMLAttributes

export type HTMLDivAttributes = HTMLAttributes

export type HTMLHeadingAttributes = HTMLAttributes

export type HTMLLIAttributes = {
  value?: string
} & HTMLAttributes

export type HTMLMeterAttributes = {
  high?: string
  low?: string
  max?: string
  min?: string
  optimum?: string
  value?: string
} & HTMLAttributes

export type HTMLModAttributes = {
  cite?: string
  datetime?: string
} & HTMLAttributes

export type HTMLOListAttributes = {
  reversed?: string
  start?: string
  type?: '1' | 'A' | 'a' | 'I' | 'i'
} & HTMLAttributes

export type HTMLParagraphAttributes = HTMLAttributes

export type HTMLPreAttributes = HTMLAttributes

export type HTMLProgressAttributes = {
  max?: string
  value?: string
} & HTMLAttributes

export type HTMLQuoteAttributes = {
  cite?: string
} & HTMLAttributes

export type HTMLSpanAttributes = HTMLAttributes

export type HTMLTimeAttributes = {
  datetime?: string
} & HTMLAttributes

export type HTMLUListAttributes = HTMLAttributes
