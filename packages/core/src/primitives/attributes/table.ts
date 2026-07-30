import { type HTMLAttributes } from './base'

export type HTMLTableAttributes = HTMLAttributes

export type HTMLTableCaptionAttributes = HTMLAttributes

export type HTMLTableCellAttributes = {
  colspan?: string
  headers?: string
  rowspan?: string
  scope?: 'col' | 'colgroup' | 'row' | 'rowgroup'
} & HTMLAttributes

export type HTMLTableColAttributes = {
  span?: string
} & HTMLAttributes

export type HTMLTableRowAttributes = HTMLAttributes

export type HTMLTableSectionAttributes = HTMLAttributes
