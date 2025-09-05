import { isReactive, type Reactive, reactive, subscribe } from '@ben-js/reactivity';

import { type Component, isComponent } from '../component';

/**
 * Represents the input for the `Async` component.
 */
export type AsyncComponentInput =
  | Component
  | Promise<Component>
  | Reactive<Component | Promise<Component>>;

export const Async: {
  /**
   * Creates and returns a reactive that swaps to the provided component after resolving.
   * @param component Promised component.
   * @returns Reactive component.
   */
  (component: AsyncComponentInput): Reactive<Component>;

  /**
   * Creates and returns a reactive that swaps the provided loader to the provided component after
   * resolving.
   * @param component Promised component.
   * @param loader Loader component.
   * @returns Reactive component.
   */
  (component: AsyncComponentInput, loader?: Component): Reactive<Component | null>;
} = (arg, loader?: Component) => {
  const current = reactive<Component | null>(loader ?? null);

  const swap = (argValue: Component | Promise<Component>): void => {
    if (isComponent(argValue)) {
      current.value = argValue;
      return;
    }

    if (loader) {
      current.value = loader;
    }

    void argValue.then((component) => {
      current.value = component;
    });
  };

  let exec: () => void;

  if (isReactive(arg)) {
    exec = (): void => {
      swap(arg.value);
    };
    subscribe(arg as Reactive<Component>, exec);
  } else {
    exec = (): void => {
      swap(arg);
    };
  }

  exec();

  return current as Reactive<Component>;
};
