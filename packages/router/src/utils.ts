import { type Component } from '@ben-js/core';

import { type RouteComponent, type RouteContext } from './route';

/**
 * Imports a default-exported component.
 */
export const def =
  (
    importer: () => Promise<{ default: (ctx: RouteContext) => Component | Promise<Component> }>,
  ): RouteComponent =>
  async (ctx: RouteContext) =>
    (await importer()).default(ctx);
