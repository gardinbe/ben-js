import { join } from 'node:path';
import { type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

export type CreateViteConfigOptions = {
  path: string;
};

export const createViteConfig = async (options: CreateViteConfigOptions): Promise<UserConfig> => {
  const pkg = await getPackageJson(options.path);
  return {
    build: {
      lib: {
        entry: join(options.path, 'src/index.ts'),
        fileName: (format) => `index.${format}.js`,
        formats: ['es', 'cjs'],
      },
      outDir: join(options.path, 'dist'),
      rollupOptions: {
        external: ['@ben-js/core', '@ben-js/reactivity', '@ben-js/router'],
      },
      sourcemap: true,
    },
    plugins: [
      dts({
        rollupTypes: true,
      }),
      // banner(createBanner(pkg)),
    ],
    root: options.path,
  };
};

type Package = {
  author: string;
  name: string;
  version: string;
};

const getPackageJson = async (path: string): Promise<Package> =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
  (await import('file://' + join(path, 'package.json'), { with: { type: 'json' } })).default;

// todo: create banner here using vite-plugin-banner
// const createBanner = (pkg: Package): string => ``;
