import { isReactive } from '@ben-js/reactivity';

import { type Component } from './component';
import { type Props, type ProvidedProps, staticProp } from './props';
import { type Pojo } from './utils';

/**
 * Represents a component builder.
 */
export type ComponentWrapper = Overload<Component> & Overload<Promise<Component>>;

type Overload<C extends Component | Promise<Component>> = {
  (fn: (props?: never, ...slots: unknown[]) => C): typeof fn;
  <T extends Pojo>(
    fn: (props: Props<T>, ...slots: unknown[]) => C,
  ): (props: ProvidedProps<T>, ...slots: unknown[]) => C;
  <T extends Pojo>(
    fn: (props?: Props<T>, ...slots: unknown[]) => C,
  ): (props?: ProvidedProps<T>, ...slots: unknown[]) => C;
};

/**
 * Wraps a component constructor with uniform props.
 */
export const component: ComponentWrapper =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: any) =>
    (props?: Props, ...slots: unknown[]) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      fn(
        props
          ? Object.fromEntries(
              Object.entries(props).map(([key, value]) => [
                key,
                isReactive(value) ? value : staticProp(value),
              ]),
            )
          : undefined,
        ...slots,
      );
