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
   * @param comp Promised component.
   * @returns Reactive component.
   */
  (comp: AsyncComponentInput): Reactive<Component>;

  /**
   * Creates and returns a reactive that swaps the provided loader to the provided component after
   * resolving.
   * @param comp Promised component.
   * @param loader Loader component.
   * @returns Reactive component.
   */
  (comp: AsyncComponentInput, loader?: Component): Reactive<Component | null>;
} = (arg, loader?: Component) => {
  const current = reactive<Component | null>(loader ?? null);

  const swap = (value: Component | Promise<Component>): void => {
    if (isComponent(value)) {
      current.value = value;
      return;
    }

    if (loader) {
      current.value = loader;
    }

    void value.then((comp) => {
      current.value = comp;
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
