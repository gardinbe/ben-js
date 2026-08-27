import { createTsdownConfig } from '../../tsdown.config.factory.ts'

export default createTsdownConfig({
  packagePath: import.meta.dirname,
})
