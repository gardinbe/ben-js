import { isReactive, type Reactive } from '@ben-js/reactivity';

import { type Pojo } from './utils';

/**
 * Represents a normalized component property.
 * @template T Value type.
 */
export type NormalizedProp<T = unknown> = Reactive<T> | StaticProp<T>;

/**
 * Represents an object with normalized component properties.
 * @template T Object type.
 */
export type NormalizedProps<T = Pojo> = {
  readonly [K in keyof T]: T[K] extends undefined
    ? undefined
    : NormalizedProp<Exclude<T[K], undefined>>;
};

/**
 * Represents a static component property.
 */
export type StaticProp<T = unknown> = {
  readonly [StaticPropSymbol]: true;
  readonly value: T;
};

/**
 * Symbol to identify components.
 */
export const StaticPropSymbol = Symbol('ben-js.component');

/**
 * Checks if the provided value is a static property.
 * @param value Value to check.
 * @returns True if the provided value is a static property.
 */
export const isStaticProp = (value: unknown): value is StaticProp =>
  typeof value === 'object' && !!value && StaticPropSymbol in value;

/**
 * Creates a static property.
 * @param value Value.
 * @returns Static property.
 */
export const staticProp = <T>(value: T): StaticProp<T> => ({
  [StaticPropSymbol]: true,
  value,
});

/**
 * Represents a component property.
 * @template T Value type.
 */
export type Prop<T = unknown> = Reactive<T> | T;

/**
 * Represents an object with component properties.
 * @template T Object type.
 */
export type Props<T = Pojo> = {
  [K in keyof T]: T[K] extends undefined ? undefined : Prop<Exclude<T[K], undefined>>;
};

/**
 * Normalizes the provided component properties.
 * @param props Component properties.
 * @returns Normalized component properties.
 */
export const normalize = <T>(props: Props<T>): NormalizedProps<T> =>
  Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      isReactive(value) ? value : staticProp(value),
    ]),
  ) as NormalizedProps<T>;
