import { type Derived, reactive, isReactive, subscribe } from '@ben-js/reactivity';
import { isComponent, type Component } from '../component';
import type { AnyComponent, AwaitableComponent } from '../types/utils';

export const Async: {
  /**
   * Creates and returns a reactive that swaps to the provided component after resolving.
   * @param component Awaitable component.
   * @returns Reactive component.
   */
  (component: AnyComponent): Derived<Component>;

  /**
   * Creates and returns a reactive that swaps the provided loader to the provided component after
   * resolving.
   * @param component Awaitable component.
   * @param loader Loader component.
   * @returns Reactive component.
   */
  (component: AnyComponent, loader: Component): Derived<Component | null>;
} = (arg, loader?: Component) => {
  const current = reactive<Component | null>(loader ?? null);

  /**
   * Swaps the component.
   * @param component Unwrapped awaitable component.
   * @internal
   */
  const swap = async (component: AwaitableComponent) => {
    if (isComponent(component)) {
      current.value = component;
      return;
    }

    if (loader) {
      current.value = loader;
    }

    current.value = await component;
  };

  /**
   * Executes the swap.
   * @internal
   */
  let exec: () => void;

  if (isReactive(arg)) {
    exec = () => swap(arg.value);
    subscribe(arg, exec);
  } else {
    exec = () => swap(arg);
  }

  exec();

  return current as Derived<Component>;
};
