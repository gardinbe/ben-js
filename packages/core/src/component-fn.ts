import { isReactive } from '@ben-js/reactivity';
import { type Component } from './component';
import type { Props } from './types/props';

/**
 * Represents a component function.
 */
export type ComponentFunction = {
  <TComponent = Component>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (props?: any, ...slots: unknown[]) => TComponent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): (props?: any, ...slots: unknown[]) => TComponent;
  <TProps extends Record<string, unknown>, TComponent = Component>(
    fn: (props: TProps, ...slots: unknown[]) => TComponent
  ): (props: Props<TProps>, ...slots: unknown[]) => TComponent;
  <TProps extends Record<string, unknown>, TComponent = Component>(
    fn: (props?: TProps, ...slots: unknown[]) => TComponent
  ): (props?: Props<TProps>, ...slots: unknown[]) => TComponent;
};

// todo: fix docs

/**
 * Creates and returns a reactive-context component function.
 *
 * Provides reactivity to props.
 * @param fn Component creation function.
 * @returns Reactive-context component function.
 */
export const component: ComponentFunction =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: any) =>
    (props?: Record<string, unknown>, ...slots: unknown[]) => {
      return fn(
        props
          ? Object.entries(props).reduce(
              (acc, [key, value]) => ({
                ...acc,
                get [key]() {
                  return isReactive(value) ? value.value : value;
                },
                set [key](_value: unknown) {
                  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                  isReactive(value) ? (value.value = _value) : (props[key] = _value);
                }
              }),
              {}
            )
          : undefined,
        ...slots
      );
    };
