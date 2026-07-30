import { join } from 'node:path'

import { createTsupConfig } from '../../tsup.config.factory'

const path = import.meta.dirname

export default [
  createTsupConfig({
    path,
  }),
  createTsupConfig({
    clean: false,
    entry: {
      dev: join(path, 'src/dev.ts'),
    },
    path,
  }),
]
