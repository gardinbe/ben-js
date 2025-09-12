import { type Reactive } from '@ben-js/reactivity';

import { type Pojo } from './utils';

/**
 * Represents a component property.
 * @template T Value type.
 */
export type Prop<T = unknown> = Reactive<T> | StaticProp<T>;

/**
 * Represents an object with component properties.
 * @template T Object type.
 */
export type Props<T = Pojo> = {
  readonly [K in keyof T]: Prop<T[K]>;
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
 * Represents a property provided to a component.
 * @template T Value type.
 */
export type ProvidedProp<T = unknown> = Reactive<Exclude<T, undefined>> | T;

/**
 * Represents an object with properties provided to a component.
 * @template T Object type.
 */
export type ProvidedProps<T = Pojo> = {
  [K in keyof T]: ProvidedProp<T[K]>;
};
