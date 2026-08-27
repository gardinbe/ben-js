import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { defineConfig } from 'tsdown'

export type CreateTsdownConfigOptions = {
  packagePath: string
  clean?: boolean
  define?: Record<string, string>
  entry?: Record<string, string>
  minify?: boolean
}

export const createTsdownConfig = (
  options: CreateTsdownConfigOptions,
): ReturnType<typeof defineConfig> => {
  const pkg = getPackageJson(options.packagePath)

  return defineConfig({
    banner: {
      js: createBanner(pkg),
    },
    clean: options.clean ?? true,
    ...(options.define ? { define: options.define } : {}),
    deps: {
      neverBundle: true,
    },
    dts: true,
    entry: options.entry ?? {
      index: join(options.packagePath, 'src/index.ts'),
    },
    format: ['esm', 'cjs'],
    minify: options.minify ?? false,
    outDir: join(options.packagePath, 'dist'),
    sourcemap: true,
    tsconfig: join(options.packagePath, 'tsconfig.app.json'),
    outExtensions: ({ format }) => ({
      dts: '.d.ts',
      js: format === 'es' ? '.mjs' : '.cjs',
    }),
  })
}

type Package = {
  author: string
  name: string
  version: string
}

const getPackageJson = (packagePath: string): Package => {
  const contents = readFileSync(join(packagePath, 'package.json'), 'utf8')
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const pkg = JSON.parse(contents) as Partial<Package>

  if (
    typeof pkg.author !== 'string' ||
    typeof pkg.name !== 'string' ||
    typeof pkg.version !== 'string'
  ) {
    throw new TypeError(
      `Invalid package metadata in ${join(packagePath, 'package.json')}`,
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
