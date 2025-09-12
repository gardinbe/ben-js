import { type AwaitableComponent } from '@ben-js/core';
import { type RouteComponent, type RouteContext } from '../types/route';

/**
 * Returns a function that asynchronously loads a component from a dynamic import with a default
 * component export.
 */
export const def =
  (
    importer: () => Promise<{ default: (ctx: RouteContext) => AwaitableComponent }>
  ): RouteComponent =>
  async (ctx: RouteContext) =>
    (await importer()).default(ctx);
