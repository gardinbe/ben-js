import { derived, isReactive, type Reactive } from '@ben-js/reactivity';
import { isStatic, staticValue, type NormalizedValues } from './static';

// todo: shared package

export type Enum<T> = T[keyof T];

export type Pojo = {
  [key: PropertyKey]: unknown;
};

export type UUID = `${string}-${string}-${string}-${string}-${string}`;

export const createUUID = (): UUID =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  }) as UUID;

export type Props<T = Pojo> = {
  [K in keyof T]: T[K] extends undefined ? undefined : Prop<Exclude<T[K], undefined>>;
};

export type Prop<T> = Reactive<T> | T;

export const attrs = (obj: Pojo): string | Reactive<string> => {
  const create = () =>
    Object.entries(obj)
      .map(([key, value]) => [key, isReactive(value) || isStatic(value) ? value.value : value])
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => (key ? `${key}="${value}"` : key))
      .join(' ');

  if (Object.values(obj).some(isReactive)) {
    return derived(create);
  }

  return create();
};

export const cn = (...classes: unknown[]): string | Reactive<string> => {
  const create = () =>
    classes
      .map((cls) => (isReactive(cls) || isStatic(cls) ? cls.value : cls))
      .filter((cls) => !!cls)
      .filter((cls, i, arr) => arr.indexOf(cls) === i)
      .join(' ');

  if (classes.some(isReactive)) {
    return derived(create);
  }

  return create();
};

export const normalize = <T>(props: Props<T>): NormalizedValues<T> =>
  Object.fromEntries(
    Object.entries(props).map(([key, value]) => [
      key,
      isReactive(value) ? value : staticValue(value),
    ]),
  ) as NormalizedValues<T>;
