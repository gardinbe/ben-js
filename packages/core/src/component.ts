import { isReactive, type Reactive, subscribe, unsubscribe } from '@ben-js/reactivity';

import { isStaticProp } from './props';
import { isRef, type Ref } from './ref';

/**
 * Represents a component.
 */
export type Component = {
  readonly [ComponentSymbol]: true;

  /**
   * Destroys the component.
   */
  destroy: () => void;

  /**
   * Component hooks.
   */
  hooks: {
    /**
     * Invokes the provided function when the component is mounted.
     */
    mounted: Hook;

    /**
     * Invokes the provided function when the component is unmounted.
     */
    unmounted: Hook;
  };

  /**
   * Mounts the component to the provided target.
   *
   * Replaces the provided node with the component.
   * @param node Node/selector to mount the component to.
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
 * Creates a component.
 * @param strings Template strings.
 * @param values Template values.
 * @returns Component.
 */
export const html = (strings: TemplateStringsArray, ...values: unknown[]): Component => {
  const parts: TemplateParts = {
    strings,
    values,
  };
  const marker = document.createComment(ComponentMarker);
  let nodes: ChildNode[] = [];
  let content: ComponentContent | null = null;
  let mounted = false;
  const hooks = {
    mounted: new Set<HookFunction>(),
    unmounted: new Set<HookFunction>(),
  };

  const mount: Component['mount'] = (target) => {
    const targetNode = typeof target === 'string' ? document.querySelector(target) : target;

    if (!targetNode) {
      throw new Error('ben-js: missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js: mount node is an orphan');
    }

    if (mounted) {
      unmount();
    } else if (!nodes.length) {
      render();
    }

    parent.replaceChild(marker, targetNode);
    nodes.forEach((node) => {
      parent.insertBefore(node, marker);
    });
    mounted = true;
    hooks.mounted.forEach((fn) => {
      fn();
    });
  };

  const unmount: Component['unmount'] = () => {
    content?.components.forEach((component) => {
      component.unmount();
    });
    nodes.forEach((node) => {
      node.remove();
    });
    marker.remove();
    mounted = false;
    hooks.unmounted.forEach((fn) => {
      fn();
    });
  };

  const clean = (newContent?: ComponentContent): void => {
    withDifference(content?.reactives, newContent?.reactives, (rx) => {
      unsubscribe(rx, render);
    });

    withDifference(content?.refs, newContent?.refs, (ref) => {
      ref.el.value = null;
    });

    withDifference(content?.components, newContent?.components, (component) => {
      component.destroy();
    });

    withDifference(newContent?.reactives, content?.reactives, (rx) => {
      subscribe(rx, render);
    });
  };

  const destroy: Component['destroy'] = () => {
    clean();
    content = null;
    unmount();
    nodes = [];
  };

  const isSameContent = (newContent: ComponentContent): boolean =>
    !!content &&
    newContent.html === content.html &&
    newContent.components.symmetricDifference(content.components).size === 0 &&
    newContent.reactives.symmetricDifference(content.reactives).size === 0 &&
    newContent.refs.symmetricDifference(content.refs).size === 0;

  const render: Component['render'] = () => {
    const newContent = createContent(parts);

    if (isSameContent(newContent)) {
      return;
    }

    clean(newContent);
    content = newContent;
    const frag = createFragment(newContent);

    if (mounted) {
      nodes.forEach((node) => {
        node.remove();
      });
    }

    nodes = [...frag.childNodes];

    if (mounted) {
      marker.parentNode?.insertBefore(frag, marker);
    }
  };

  render();

  return {
    [ComponentSymbol]: true,
    destroy,
    hooks: {
      mounted: (fn: HookFunction): void => {
        hooks.mounted.add(fn);
      },
      unmounted: (fn: HookFunction): void => {
        hooks.unmounted.add(fn);
      },
    },
    mount,
    render,
    unmount,
  };
};

/**
 * Represents a component hook.
 */
export type Hook = (fn: HookFunction) => void;

/**
 * Represents a component hook function.
 */
export type HookFunction = () => void;

type ComponentContent = {
  components: Set<Component>;
  html: string;
  reactives: Set<Reactive>;
  refs: Set<Ref>;
};

type TemplateParts = {
  strings: TemplateStringsArray;
  values: unknown[];
};

const createContent = (parts: TemplateParts): ComponentContent => {
  const parseValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => parseValue(item)).join('');
    }

    if (isStaticProp(value)) {
      return parseValue(value.value);
    }

    if (isReactive(value)) {
      reactives.add(value);
      return parseValue(value.value);
    }

    if (isComponent(value)) {
      components.add(value);
      return `<!--${ChildComponentMarker}-->`;
    }

    if (isRef(value)) {
      refs.add(value);
      return value.uuid;
    }

    return stringify(value);
  };

  const reactives = new Set<Reactive>();
  const components = new Set<Component>();
  const refs = new Set<Ref>();
  const html = parts.strings.map((str, i) => str + parseValue(parts.values[i])).join('');

  return {
    components,
    html,
    reactives,
    refs,
  };
};

const stringify = (value: unknown): string => (value != null && value !== false ? `${value}` : '');

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

  content.refs.forEach((rf) => {
    const el = frag.querySelector<HTMLElement>(`[ref='${rf.uuid}']`);

    if (!el) {
      throw new Error('ben-js: ref target element missing');
    }

    el.removeAttribute('ref');
    rf.el.value = el;
  });

  const markers = getMarkers(frag, ChildComponentMarker);

  if (markers.length !== content.components.size) {
    throw new Error('ben-js: component marker count mismatch');
  }

  markers.forEach((marker, i) => {
    [...content.components][i]!.mount(marker);
  });

  return frag;
};

const withDifference = <T>(
  target: Set<T> | undefined,
  other: Set<T> | undefined,
  fn: (item: T) => void,
): void => {
  if (!target) {
    return;
  }

  if (other) {
    target.difference(other).forEach(fn);
  } else {
    target.forEach(fn);
  }
};
