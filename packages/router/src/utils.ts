import { type Component } from '@ben-js/core';

import { type RouteComponent, type RouteContext } from './route';

/**
 * Imports a default-exported component.
 */
export const def =
  (importer: () => Promise<ExportedRoute>): RouteComponent =>
  async (ctx: RouteContext) =>
    (await importer()).default(ctx);

type ExportedRoute = {
  default: (ctx: RouteContext) => Component | Promise<Component>;
};
