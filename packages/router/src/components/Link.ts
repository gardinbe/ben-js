import {
  attrs,
  type Component,
  html,
  type HTMLAnchorAttributes,
  normalize,
  type Props,
  ref,
} from '@ben-js/core'

import { currentPath, go } from '../route'

export const Link = (
  props: Props<HTMLAnchorAttributes>,
  slot: unknown,
): Component => {
  const { href } = normalize(props)
  const a = ref<HTMLAnchorElement>()

  a.on('click', ev => {
    ev.preventDefault()
    go(href.value)
  })

  return html`<a
    ref="${a}"
    ${attrs(props)}
    ${() =>
      currentPath.value === new URL(href.value, document.baseURI).pathname &&
      'data-route-active'}
    >${slot}</a
  >`
}
