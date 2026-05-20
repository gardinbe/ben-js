export type HTMLAnchorAttributes = {
  href: string
  download?: string
  ping?: string
  referrerpolicy?:
    | 'no-referrer-when-downgrade'
    | 'no-referrer'
    | 'origin-when-cross-origin'
    | 'origin'
    | 'same-origin'
    | 'strict-origin-when-cross-origin'
    | 'strict-origin'
    | 'unsafe-url'
  rel?: string
  target?: '__unfencedTop' | '_blank' | '_parent' | '_self' | '_top'
} & HTMLAttributes

export type HTMLAttributes = {
  [key: string]: string
  class?: string
  id?: string
  style?: string
}
