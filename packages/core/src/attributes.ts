export type HTMLAnchorAttributes = HTMLAttributes & {
  href: string;
  target?: '__unfencedTop' | '_blank' | '_parent' | '_self' | '_top';
  rel?: string;
  download?: string;
  referrerpolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
  ping?: string;
};

export type HTMLAttributes = {
  [key: string]: string;
  class?: string;
  id?: string;
  style?: string;
};
