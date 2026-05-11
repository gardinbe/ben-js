import { type RouteComponent, type RouteContext } from './route';

export const define =
  (importer: () => Promise<ExportedRouteComponent>): RouteComponent =>
  async (ctx: RouteContext) => {
    const { default: route } = await importer();
    return typeof route === 'function' ? route(ctx) : route;
  };

export type ExportedRouteComponent = {
  default: RouteComponent;
};
