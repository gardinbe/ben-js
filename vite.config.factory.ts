import { join } from 'node:path';
import { type UserConfig } from 'vite';
import dts from 'vite-plugin-dts';
import banner from 'vite-plugin-banner';

export type CreateViteConfigOptions = {
  /**
   * Path to the root directory of the package.
   */
  path: string;
};

/**
 * Creates and returns a Vite build config.
 * @returns Vite config.
 * @internal
 */
export const createViteConfig = async (options: CreateViteConfigOptions): Promise<UserConfig> => {
  const pkg = await getPackageJson(options.path);
  return {
    root: options.path,
    plugins: [
      dts({
        rollupTypes: true
      }),
      banner(createBanner(pkg))
    ],
    build: {
      sourcemap: true,
      outDir: join(options.path, 'dist'),
      lib: {
        entry: join(options.path, 'src/index.ts'),
        fileName: (format) => `index.${format}.js`,
        formats: ['es', 'cjs']
      },
      rollupOptions: {
        external: ['ben-js', '@ben-js/core', '@ben-js/reactivity', '@ben-js/router']
      }
    }
  };
};

/**
 * Represents a package.json file.
 */
type Package = {
  name: string;
  version: string;
  author: string;
};

/**
 * Returns the package.json within the given directory.
 * @param path - Directory to get package.json from.
 * @returns Package.json object.
 */
const getPackageJson = async (path: string): Promise<Package> =>
  (await import(`file://${join(path, 'package.json')}`, { with: { type: 'json' } })).default;

/**
 * Returns a banner string for the given package.
 * @param pkg - Package to create banner for.
 * @returns Banner string.
 */
const createBanner = (pkg: Package): string =>
  `/**\n * ${pkg.name}\n * @version ${pkg.version}\n * @author ${pkg.author}\n * @license MIT\n * @copyright ${new Date().getFullYear()} ${pkg.author}\n */`;
