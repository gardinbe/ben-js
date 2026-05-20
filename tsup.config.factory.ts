import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'tsup'

export type CreateTsupConfigOptions = {
  path: string
}

export const createTsupConfig = (
  options: CreateTsupConfigOptions,
): ReturnType<typeof defineConfig> => {
  const pkg = getPackageJson(options.path)

  return defineConfig({
    banner: {
      js: createBanner(pkg),
    },
    clean: true,
    dts: {
      compilerOptions: {
        composite: false,
        ignoreDeprecations: '6.0',
        incremental: false,
        noEmit: false,
      },
    },
    entry: {
      index: join(options.path, 'src/index.ts'),
    },
    external: ['*'],
    format: ['esm', 'cjs'],
    outDir: join(options.path, 'dist'),
    sourcemap: true,
    tsconfig: join(options.path, 'tsconfig.app.json'),
    outExtension: ({ format }) => ({
      js: format === 'esm' ? '.mjs' : '.cjs',
    }),
  })
}

type Package = {
  author: string
  name: string
  version: string
}

const getPackageJson = (path: string): Package => {
  const contents = readFileSync(join(path, 'package.json'), 'utf8')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const pkg = JSON.parse(contents) as Partial<Package>

  if (
    typeof pkg.author !== 'string' ||
    typeof pkg.name !== 'string' ||
    typeof pkg.version !== 'string'
  ) {
    throw new TypeError(
      `Invalid package metadata in ${join(path, 'package.json')}`,
    )
  }

  return {
    author: pkg.author,
    name: pkg.name,
    version: pkg.version,
  }
}

const createBanner = (pkg: Package): string =>
  `/*!
 * ${pkg.name} v${pkg.version}
 * Copyright ${new Date().getFullYear()} ${pkg.author}
 * Released under the MIT License.
 */`
