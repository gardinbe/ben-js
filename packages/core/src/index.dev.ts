import { printTree } from './internal/dev/print-tree'
import { type Component } from './primitives/component'

declare global {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Window {
    __FLAME__: {
      // eslint-disable-line eslint/no-underscore-dangle
      readonly printTree: (component: Component) => void
    }
  }
}

export * from '#index.ts'

// oxlint-disable-next-line eslint/no-underscore-dangle
window.__FLAME__ = {
  printTree,
}
