import { isReactive, type Reactive, subscribe, unsubscribe } from '@ben-js/reactivity';

import type { Pojo } from './utils';

import { isStaticProp, type Props, type ProvidedProps, staticProp } from './props';
import { isRef, type Ref } from './ref';

/**
 * Represents a component.
 */
export type Component = {
  readonly [ComponentSymbol]: true;
  /**
   * Mounts the component to the provided target.
   *
   * Replaces the provided node with the component.
   * @param node Node or selector to mount the component to.
   */
  mount: (target: Node | string) => void;

  /**
   * Renders the component.
   */
  render: () => void;

  /**
   * Unmounts the component.
   */
  unmount: () => void;
};

/**
 * Symbol to identify components.
 */
export const ComponentSymbol = Symbol('ben-js.component');

/**
 * Marker to identify components.
 */
export const ComponentMarker = ' ben-js.component ';

/**
 * Marker to identify child components.
 */
export const ChildComponentMarker = ' ben-js.child-component ';

/**
 * Checks if the provided value is a component.
 * @param value Value to check.
 * @returns True if the provided value is a component.
 */
export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && ComponentSymbol in value;

/**
 * Creates and returns a component.
 * @param strings Template strings.
 * @param values Template values.
 * @returns Component.
 * @example
 * ```typescript
 * const HelloWorld = () => {
 *   const message = 'hello world!';
 *   return html`<div>${message}</div>`;
 * };
 * ```
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): Component => {
  const parts: TemplateParts = { strings, values };
  const marker = document.createComment(ComponentMarker);
  let nodes: Node[] = [];
  // todo: maybe don't bin all content, just remove unused
  let content: ComponentContent | null = null;

  const mount: Component['mount'] = (target) => {
    const targetNode = typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetNode) {
      throw new Error('ben-js: missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js: mount node is an orphan');
    }

    parent.replaceChild(marker, targetNode);
    nodes.forEach((node) => parent.insertBefore(node, marker));
    render();
  };

  const unmount: Component['unmount'] = () => {
    const parent = marker.parentNode;
    nodes.forEach((node) => parent?.removeChild(node));
    // todo: this errors, fix
    // cleanup();
    parent?.removeChild(marker);
    nodes = [];
    content = null;
  };

  const render: Component['render'] = () => {
    // todo: check unnecessary rerenders
    const parent = marker.parentNode;

    if (!parent) {
      return;
    }

    const newContent = createContent(parts);
    cleanup(newContent);
    content = newContent;

    const frag = createFragment(newContent);
    nodes.forEach((node) => parent.removeChild(node));
    nodes = [...frag.childNodes];
    parent.insertBefore(frag, marker);
  };

  const cleanup = (newContent?: ComponentContent): void => {
    content?.reactives
      .filter((reactive) => !newContent?.reactives.includes(reactive))
      .forEach((reactive) => {
        unsubscribe(reactive, render);
      });
    newContent?.reactives
      .filter((reactive) => !content?.reactives.includes(reactive))
      .forEach((reactive) => {
        subscribe(reactive, render);
      });
    content?.components
      .filter((component) => !newContent?.components.includes(component))
      .forEach((component) => {
        component.unmount();
      });
  };

  return {
    [ComponentSymbol]: true,
    mount,
    render,
    unmount,
  };
};

type ComponentContent = {
  components: Component[];
  html: string;
  reactives: Reactive[];
  refs: Map<Guid, Ref>;
};

type Guid = ReturnType<typeof crypto.randomUUID>;

type TemplateParts = {
  strings: TemplateStringsArray;
  values: unknown[];
};

const stringify = (value: unknown): string => (value != null ? `${value}` : '');

const createContent = (parts: TemplateParts): ComponentContent => {
  const reactives: Reactive[] = [];
  const components: Component[] = [];
  const refs = new Map<Guid, Ref>();

  const parseValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => parseValue(item)).join('');
    }

    if (isReactive(value)) {
      reactives.push(value);
      return parseValue(value.value);
    }

    if (isComponent(value)) {
      components.push(value);
      return `<!--${ChildComponentMarker}-->`;
    }

    if (isRef(value)) {
      const uuid = crypto.randomUUID();
      refs.set(uuid, value);
      return uuid;
    }

    if (isStaticProp(value)) {
      return parseValue(value.value);
    }

    return stringify(value);
  };

  const html = parts.strings.map((str, i) => str + parseValue(parts.values[i])).join('');

  return {
    components,
    html,
    reactives,
    refs,
  };
};

const getMarkers = (node: Node, text: string): Comment[] => {
  const comments =
    node.nodeType === Node.COMMENT_NODE && node.textContent === text ? ([node] as Comment[]) : [];
  const childComments = [...node.childNodes].flatMap((child) => getMarkers(child, text));
  return comments.concat(childComments);
};

const createFragment = (content: ComponentContent): DocumentFragment => {
  const tpl = document.createElement('template');
  tpl.innerHTML = content.html;
  const frag = tpl.content;

  content.refs.forEach((ref, guid) => {
    const el = frag.querySelector<HTMLElement>(`[ref="${guid}"]`);

    if (!el) {
      throw new Error('ben-js: ref target element missing');
    }

    el.removeAttribute('ref');
    ref.el.value = el;
  });

  const markers = getMarkers(frag, ChildComponentMarker);

  if (markers.length !== content.components.length) {
    throw new Error('ben-js: component marker count mismatch');
  }

  markers.forEach((marker, i) => {
    content.components[i]!.mount(marker);
  });

  return frag;
};

/**
 * Represents a component builder.
 */
export type ComponentBuilder = Overload<Component> &
  Overload<Promise<Component>> &
  Overload<Reactive<Component>> &
  Overload<Reactive<Promise<Component>>>;

type AnyComponent =
  | Component
  | Promise<Component>
  | Reactive<Component>
  | Reactive<Component | Promise<Component>>
  | Reactive<Promise<Component>>;

type Overload<R extends AnyComponent> = {
  (fn: (props?: never, ...slots: unknown[]) => R): typeof fn;
  <T extends Pojo>(
    fn: (props: Props<T>, ...slots: unknown[]) => R,
  ): (props: ProvidedProps<T>, ...slots: unknown[]) => R;
  <T extends Pojo>(
    fn: (props?: Props<T>, ...slots: unknown[]) => R,
  ): (props?: ProvidedProps<T>, ...slots: unknown[]) => R;
};

/**
 * Wraps a component constructor with uniform props.
 * @param fn Component constructor.
 * @returns Component constructor with uniform props.
 */
export const component: ComponentBuilder =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (fn: any) =>
    (props?: Props, ...slots: unknown[]) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      fn(
        props
          ? Object.entries(props).reduce<Pojo>((acc, [key, value]) => {
              acc[key] = isReactive(value) ? value : staticProp(value);
              return acc;
            }, {})
          : undefined,
        ...slots,
      );
