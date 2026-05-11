import {
  attrs,
  type Component,
  html,
  type HTMLAnchorAttributes,
  normalize,
  type Props,
  ref,
} from '@ben-js/core';

import { go } from '../route';

export const Link = (props: Props<HTMLAnchorAttributes>, slot: unknown): Component => {
  const { href } = normalize(props);
  const a = ref();

  a.on('click', (ev) => {
    ev.preventDefault();
    go(href.value);
  });

  return html`<a
    ref="${a}"
    ${attrs(props)}
    >${slot}</a
  > `;
};
