export type AttributeValue = string

export type BooleanAttribute = '' | 'false' | 'true'

export type Capture = 'environment' | 'user'

export type CrossOrigin = 'anonymous' | 'use-credentials'

export type Decoding = 'async' | 'auto' | 'sync'

export type Direction = 'auto' | 'ltr' | 'rtl'

export type FetchPriority = 'auto' | 'high' | 'low'

export type HTMLAttributes = {
  [key: string]: AttributeValue | undefined
  accesskey?: string
  autocapitalize?: 'characters' | 'none' | 'off' | 'on' | 'sentences' | 'words'
  autofocus?: BooleanAttribute
  class?: string
  contenteditable?: 'false' | 'plaintext-only' | 'true'
  dir?: Direction
  draggable?: 'false' | 'true'
  enterkeyhint?:
    | 'done'
    | 'enter'
    | 'go'
    | 'next'
    | 'previous'
    | 'search'
    | 'send'
  exportparts?: string
  hidden?: 'until-found' | BooleanAttribute
  id?: string
  inert?: BooleanAttribute
  inputmode?:
    | 'decimal'
    | 'email'
    | 'none'
    | 'numeric'
    | 'search'
    | 'tel'
    | 'text'
    | 'url'
  is?: string
  itemid?: string
  itemprop?: string
  itemref?: string
  itemscope?: BooleanAttribute
  itemtype?: string
  lang?: string
  nonce?: string
  part?: string
  popover?: 'auto' | 'manual'
  role?: string
  slot?: string
  spellcheck?: 'false' | 'true'
  style?: string
  tabindex?: string
  title?: string
  translate?: 'no' | 'yes'
}

export type Loading = 'eager' | 'lazy'

export type ReferrerPolicy =
  | 'no-referrer-when-downgrade'
  | 'no-referrer'
  | 'origin-when-cross-origin'
  | 'origin'
  | 'same-origin'
  | 'strict-origin-when-cross-origin'
  | 'strict-origin'
  | 'unsafe-url'

export type Target = '__unfencedTop' | '_blank' | '_parent' | '_self' | '_top'

export type Wrap = 'hard' | 'off' | 'soft'
