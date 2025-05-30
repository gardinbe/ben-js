import { html, ref, type Component } from '@ben-js/core';
import { go } from '../path';

/**
 * Represents the props of a Link component.
 */
export type LinkProps = Partial<HTMLAnchorElement> &
  Required<Pick<HTMLAnchorElement, 'href'>> & {
    /**
     * HTML content of the link.
     */
    content: unknown;
  };

/**
 * Creates and returns a Link component.
 * @param props - Link props.
 * @returns Link component.
 */
export const Link = (props: LinkProps): Component => {
  const a = ref();

  a.on('click', (ev) => {
    ev.preventDefault();
    go(props.href);
  });

  const attrs = Object.entries(props)
    .filter(([key]) => key !== 'content')
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  return html`<a
    ref="${a}"
    ${attrs}
    >${props.content}</a
  >`;
};
