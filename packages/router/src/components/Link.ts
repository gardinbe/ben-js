import {
  attrs,
  type Component,
  html,
  type HTMLAnchorAttributes,
  normalize,
  type Props,
  ref,
} from '@flame/core'

import { currentPath, go } from '../primitives/route'

export const Link = (
  props: Props<HTMLAnchorAttributes>,
  slot: unknown,
): Component => {
  const { href } = normalize(props)
  const anchor = ref<HTMLAnchorElement>()

  anchor.on('click', ev => {
    ev.preventDefault()

    if (!href.value) {
      return
    }

    go(href.value)
  })

  return html`
    <a
      ref="${anchor}"
      ${attrs(props)}
      ${() =>
        currentPath.value === new URL(href.value, document.baseURI).pathname &&
        'data-route-active'}
      >${slot}</a
    >
  `
}
