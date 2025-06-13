import { attrs, html, ref, type Component, type HTMLAnchorAttributes } from '@ben-js/core';
import { go } from '../route';
import { isReactive, type MaybeReactiveObject } from '@ben-js/reactivity';

/**
 * Represents the props of a Link component.
 */
export type LinkProps = MaybeReactiveObject<HTMLAnchorAttributes>;

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
