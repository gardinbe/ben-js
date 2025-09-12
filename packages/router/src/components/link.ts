import { attrs, html, ref, type Component, type HTMLAttributes } from '@ben-js/core';
import { go } from '../route';
import { isReactive, type MaybeReactiveObject } from '@ben-js/reactivity';

/**
 * Represents the props of a Link component.
 */
export type LinkProps = MaybeReactiveObject<
  HTMLAttributes & {
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
  }
>;

/**
 * Creates and returns a Link component.
 * @param props - Link props.
 * @param slot - Slot content.
 * @returns Link component.
 */
export const Link = (props: LinkProps, slot: unknown): Component => {
  const a = ref();

  a.on('click', (ev) => {
    ev.preventDefault();
    go(isReactive(props.href) ? props.href.value : props.href);
  });

  // prettier-ignore
  return html`<a ref="${a}" ${attrs(props)}>
    ${slot}
  </a>`;
};
