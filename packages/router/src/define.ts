import { type Route, type RouteContext } from './route';

/**
 * Defines a route component using a dynamic import.
 * @param importer Importer function.
 * @returns Route component/component constructor.
 */
export const define =
  (importer: () => Promise<ExportedRoute>): Route =>
  async (ctx: RouteContext) => {
    const { default: route } = await importer();
    return typeof route === 'function' ? route(ctx) : route;
  };

type ExportedRoute = {
  default: Route;
};
