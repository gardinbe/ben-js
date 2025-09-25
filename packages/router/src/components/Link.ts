import {
  attributes,
  type Component,
  html,
  type HTMLAnchorAttributes,
  normalize,
  type Props,
  ref,
} from '@ben-js/core';

import { go } from '../route';

export type LinkProps = Props<HTMLAnchorAttributes>;

/**
 * Creates a Link component.
 * @param props Link props.
 * @param slot Slot content.
 * @returns Link component.
 */
export const Link = (props: LinkProps, slot: unknown): Component => {
  const { href } = normalize(props);
  const a = ref();

  a.on('click', (ev) => {
    ev.preventDefault();
    go(href.value);
  });

  return html`<a
    ref="${a}"
    ${attributes(props)}
    >${slot}</a
  > `;
};
