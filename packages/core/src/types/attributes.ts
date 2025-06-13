/**
 * Represents HTML attributes.
 */
export type HTMLAttributes = {
  /**
   * Defines an identifier (ID) which must be unique in the whole document
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id
   */
  id?: string;

  /**
   * List of the classes of the element.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/class
   */
  class?: string;

  /**
   * Contains CSS styling declarations to be applied to the element.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/style
   */
  style?: string;

  [key: string]: string;
};

/**
 * Represents HTML anchor attributes.
 */
export type HTMLAnchorAttributes = HTMLAttributes & {
  /**
   * URL that the hyperlink points to.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href
   */
  href: string;

  /**
   * Causes the browser to treat the linked URL as a download.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download
   */
  download?: string;

  /**
   * A space-separated list of URLs.
   *
   * When the link is followed, the browser will send POST requests with the body PING to the URLs.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping
   */
  ping?: string;

  /**
   * How much of the referrer to send when following the link.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy
   */
  referrerpolicy?:
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';

  /**
   * Relationship of the linked URL as space-separated link types.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#rel
   */
  rel?: string;

  /**
   * Where to display the linked URL, as the name for a browsing context (a tab, window, or
   * <iframe>).
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target
   */
  target?: '_blank' | '_self' | '_parent' | '_top' | '__unfencedTop';
};
