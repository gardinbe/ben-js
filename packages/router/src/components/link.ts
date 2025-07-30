import { attrs, component, html, ref, type HTMLAnchorAttributes } from '@ben-js/core';
import { go } from '../route';

/**
 * Creates and returns a Link component.
 * @param props Link props.
 * @param slot Slot content.
 * @returns Link component.
 */
export const Link = component((props: HTMLAnchorAttributes, slot) => {
  const a = ref();

  a.on('click', (ev) => {
    ev.preventDefault();
    go(props.href);
  });

  // prettier-ignore
  return html`<a ref="${a}" ${attrs(props)}>${slot}</a>`;
});
