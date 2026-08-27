import { join } from 'node:path'

import { createTsdownConfig } from '../../tsdown.config.factory.ts'

const path = import.meta.dirname

export default [
  createTsdownConfig({
    define: {
      __DEV__: 'false',
    },
    minify: true,
    packagePath: path,
  }),
  createTsdownConfig({
    clean: false,
    define: {
      __DEV__: 'true',
    },
    entry: {
      'index.dev': join(path, 'src/index.dev.ts'),
    },
    packagePath: path,
  }),
]
