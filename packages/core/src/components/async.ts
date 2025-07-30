import {
  isReactive,
  type MaybeReactive,
  type Reactive,
  reactive,
  subscribe
} from '@ben-js/reactivity';
import { isComponent, type Component } from '../component';

/**
 * Represents the input for the `Async` component function.
 */
export type AsyncComponentInput = MaybeReactive<
  Component | Promise<Component> | (Component | Promise<Component>)
>;

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

  /**
   * Swaps the component.
   * @param _arg Promised component.
   * @internal
   */
  const swap = (_arg: Component | Promise<Component>) => {
    if (isComponent(_arg)) {
      current.value = _arg;
      return;
    }

    if (loader) {
      current.value = loader;
    }

    _arg.then((component) => (current.value = component));
  };

  /**
   * Executes the swap.
   * @internal
   */
  let exec: () => void;

  if (isReactive(arg)) {
    exec = () => swap(arg.value);
    subscribe(arg as Reactive<Component>, exec);
  } else {
    exec = () => swap(arg);
  }

  exec();

  return current as Reactive<Component>;
};
