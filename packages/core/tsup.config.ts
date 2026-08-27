import { join } from 'node:path'

import { createTsupConfig } from '../../tsup.config.factory'

const path = import.meta.dirname

export default [
  createTsupConfig({
    define: {
      __DEV__: 'false',
    },
    minifySyntax: true,
    path,
  }),
  createTsupConfig({
    clean: false,
    define: {
      __DEV__: 'true',
    },
    entry: {
      'index.dev': join(path, 'src/index.dev.ts'),
    },
    path,
  }),
]
