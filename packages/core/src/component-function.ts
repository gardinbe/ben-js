import { type Derived, type Reactive, isReactive, reactive } from '@ben-js/reactivity';
import type { Component } from './component';
import type { AnyComponent, AwaitableComponent } from './types/utils';

/**
 * Represents the static props for a function component.
 */
export type Props = Record<string, unknown>;

/**
 * Represents the reactive props of a function component.
 */
export type ReactiveProps<T extends Props> = { [key in keyof T]: Reactive<T[key]> };

/**
 * Represents a component function.
 */
export type ComponentFunction<R extends AnyComponent> = {
  (fn: (slot: Reactive<unknown>) => R): (slot?: unknown) => R;
  <P extends Props>(fn: (props: ReactiveProps<P>) => R): (props: P) => R;

  <P extends Props>(
    fn: (props: ReactiveProps<P>, slot: Reactive<unknown>) => R
  ): (props: P, slot?: unknown) => R;
};

/**
 * Creates and returns a component function.
 * @param fn - Function to create component.
 * @returns Component function.
 */
export const component: ComponentFunction<Component> &
  ComponentFunction<Promise<Component>> &
  ComponentFunction<AwaitableComponent> &
  ComponentFunction<Reactive<Component>> &
  ComponentFunction<Reactive<Promise<Component>>> &
  ComponentFunction<Reactive<AwaitableComponent>> &
  ComponentFunction<Derived<Component>> &
  ComponentFunction<Derived<Promise<Component>>> &
  ComponentFunction<Derived<AwaitableComponent>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => {
      const props = args.length > 1 ? args[0] : undefined;
      const slot = args.length > 1 ? args[1] : args[0];

      return fn(
        props
          ? Object.entries(props).reduce(
              (acc, [key, value]) => ({
                ...acc,
                [key]: isReactive(value) ? value : reactive(value)
              }),
              {}
            )
          : undefined,
        isReactive(slot) ? slot : reactive(slot)
      );
    };
