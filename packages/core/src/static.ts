import { type Reactive } from '@ben-js/reactivity';

import { type Pojo } from './utils';

export const staticValue = <T>(value: T): Static<T> => ({
  [StaticSymbol]: true,
  value,
});

export type Static<T = unknown> = {
  readonly [StaticSymbol]: true;
  value: T;
};

export const StaticSymbol = Symbol('ben-js.component');

export const isStatic = (value: unknown): value is Static =>
  typeof value === 'object' && !!value && StaticSymbol in value;

export type NormalizedValues<T = Pojo> = {
  readonly [K in keyof T]: NormalizedValue<T[K]>;
};

export type NormalizedValue<T = unknown> = Reactive<T> | Static<T>;
