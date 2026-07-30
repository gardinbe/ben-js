import {
  type Capture,
  type HTMLAttributes,
  type Target,
  type Wrap,
} from './base'

export type HTMLButtonAttributes = {
  disabled?: string
  form?: string
  formaction?: string
  formenctype?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain'
  formmethod?: 'dialog' | 'get' | 'post'
  formnovalidate?: string
  formtarget?: Target
  name?: string
  popovertarget?: string
  popovertargetaction?: 'hide' | 'show' | 'toggle'
  type?: 'button' | 'reset' | 'submit'
  value?: string
} & HTMLAttributes

export type HTMLDataListAttributes = HTMLAttributes

export type HTMLFieldSetAttributes = {
  disabled?: string
  form?: string
  name?: string
} & HTMLAttributes

export type HTMLFormAttributes = {
  'accept-charset'?: string
  action?: string
  autocomplete?: 'off' | 'on'
  enctype?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain'
  method?: 'dialog' | 'get' | 'post'
  name?: string
  novalidate?: string
  rel?: string
  target?: Target
} & HTMLAttributes

export type HTMLInputAttributes = {
  accept?: string
  alt?: string
  autocomplete?: string
  capture?: Capture
  checked?: string
  dirname?: string
  disabled?: string
  form?: string
  formaction?: string
  formenctype?:
    | 'application/x-www-form-urlencoded'
    | 'multipart/form-data'
    | 'text/plain'
  formmethod?: 'get' | 'post'
  formnovalidate?: string
  formtarget?: Target
  height?: string
  list?: string
  max?: string
  maxlength?: string
  min?: string
  minlength?: string
  multiple?: string
  name?: string
  pattern?: string
  placeholder?: string
  readonly?: string
  required?: string
  size?: string
  src?: string
  step?: string
  type?:
    | 'button'
    | 'checkbox'
    | 'color'
    | 'date'
    | 'datetime-local'
    | 'email'
    | 'file'
    | 'hidden'
    | 'image'
    | 'month'
    | 'number'
    | 'password'
    | 'radio'
    | 'range'
    | 'reset'
    | 'search'
    | 'submit'
    | 'tel'
    | 'text'
    | 'time'
    | 'url'
    | 'week'
  value?: string
  width?: string
} & HTMLAttributes

export type HTMLLabelAttributes = {
  for?: string
} & HTMLAttributes

export type HTMLLegendAttributes = HTMLAttributes

export type HTMLOptGroupAttributes = {
  disabled?: string
  label?: string
} & HTMLAttributes

export type HTMLOptionAttributes = {
  disabled?: string
  label?: string
  selected?: string
  value?: string
} & HTMLAttributes

export type HTMLOutputAttributes = {
  for?: string
  form?: string
  name?: string
} & HTMLAttributes

export type HTMLSelectAttributes = {
  autocomplete?: string
  disabled?: string
  form?: string
  multiple?: string
  name?: string
  required?: string
  size?: string
} & HTMLAttributes

export type HTMLTextAreaAttributes = {
  autocomplete?: string
  cols?: string
  dirname?: string
  disabled?: string
  form?: string
  maxlength?: string
  minlength?: string
  name?: string
  placeholder?: string
  readonly?: string
  required?: string
  rows?: string
  wrap?: Wrap
} & HTMLAttributes
