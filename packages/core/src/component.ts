import { type Reactive, isReactive, subscribe, unsubscribe } from '@ben-js/reactivity';
import { ComponentMarker, ChildComponentMarker } from './_internal/constants';
import { getMarkers } from './_internal/utils/get-markers';
import { stringify } from './_internal/utils/stringify';
import { type Guid } from './_internal/types/guid';
import { type Ref, isRef } from './ref';

/**
 * Represents a component.
 */
export type Component = {
  /**
   * Mounts the component to the provided node.
   *
   * Replaces the provided node with the component.
   * @param node - Node to mount the component to.
   */
  mount(node: Node): void;
  /**
   * Mounts the component to the element with the provided selector.
   *
   * Replaces the element with the component.
   * @param selector - Selector of the element to mount the component to.
   */
  mount(selector: string): void;

  /**
   * Unmounts the component.
   */
  readonly unmount: () => void;

  /**
   * Renders the component.
   */
  readonly render: () => void;

  /**
   * @internal
   */
  readonly [ComponentSymbol]: true;
};

/**
 * Symbol to identify components.
 */
export const ComponentSymbol = Symbol('ben-js.component');

/**
 * Checks if the provided value is a component.
 * @param value - Value to check.
 * @returns True if the provided value is a component.
 */
export const isComponent = (value: unknown): value is Component =>
  typeof value === 'object' && !!value && ComponentSymbol in value;

/**
 * Creates and returns a component.
 * @param strings - Template strings.
 * @param values - Template values.
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
  let currentNodes: Node[] = [];
  let currentContent: ComponentContent | null = null;

  const mount: Component['mount'] = (arg) => {
    const targetNode = typeof arg === 'string' ? document.querySelector(arg) : arg;

    if (!targetNode) {
      throw new Error('ben-js → missing mount node');
    }

    const parent = targetNode.parentNode;

    if (!parent) {
      throw new Error('ben-js → mount node has no parent');
    }

    parent.replaceChild(marker, targetNode);
    currentNodes.forEach((node) => parent.insertBefore(node, marker));
    render();
  };

  const unmount: Component['unmount'] = () => {
    const parent = marker.parentNode;
    currentNodes.forEach((node) => parent?.removeChild(node));
    // todo: this errors, fix
    // cleanup();
    parent?.removeChild(marker);
    currentNodes = [];
    currentContent = null;
  };

  const render: Component['render'] = () => {
    // todo: check unnecessary rerenders

    const parent = marker.parentNode;

    if (!parent) {
      return;
    }

    const content = createContent(parts);
    cleanup(content);
    currentContent = content;

    const frag = createFragment(content);
    currentNodes.forEach((node) => parent.removeChild(node));
    currentNodes = [...frag.childNodes];
    parent.insertBefore(frag, marker);
  };

  /**
   * Cleans up old/orphaned component content.
   * @internal
   */
  const cleanup = (newContent?: ComponentContent) => {
    currentContent?.reactives
      .filter((reactive) => !newContent?.reactives.includes(reactive))
      .forEach((reactive) => unsubscribe(reactive, render));
    newContent?.reactives
      .filter((reactive) => !currentContent?.reactives.includes(reactive))
      .forEach((reactive) => subscribe(reactive, render));
    currentContent?.components
      .filter((component) => !newContent?.components.includes(component))
      .forEach((component) => component.unmount());
  };

  return {
    mount,
    unmount,
    render,
    [ComponentSymbol]: true
  };
};

type TemplateParts = {
  readonly strings: TemplateStringsArray;
  readonly values: unknown[];
};

type ComponentContent = {
  readonly html: string;
  readonly reactives: Reactive[];
  readonly components: Component[];
  readonly refs: Map<Guid, Ref>;
};

/**
 * Creates and returns a set of content for the component.
 * @returns Component content.
 * @internal
 */
const createContent = (parts: TemplateParts): ComponentContent => {
  const reactives: Reactive[] = [];
  const components: Component[] = [];
  const refs = new Map<Guid, Ref>();

  /**
   * Returns the value parsed as a string, and registers reactives, components and refs.
   * @param value - Value to parse.
   * @returns Parsed value.
   * @internal
   */
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

    return stringify(value);
  };

  const html = parts.strings.map((str, i) => str + parseValue(parts.values[i])).join('');

  return {
    html,
    reactives,
    components,
    refs
  };
};

/**
 * Creates and returns a fragment from the provided component content.
 * @param content - Component content.
 * @returns Document fragment.
 * @internal
 */
const createFragment = (content: ComponentContent): DocumentFragment => {
  const tpl = document.createElement('template');
  tpl.innerHTML = content.html;
  const frag = tpl.content;

  content.refs.forEach((ref, guid) => {
    const el = frag.querySelector<HTMLElement>(`[ref="${guid}"]`);

    if (!el) {
      throw new Error('ben-js → missing Ref element');
    }

    el.removeAttribute('ref');
    ref.el.value = el;
  });

  const markers = getMarkers(frag, ChildComponentMarker);

  if (markers.length !== content.components.length) {
    throw new Error('ben-js → component marker count mismatch');
  }

  markers.forEach((marker, i) => content.components[i]!.mount(marker));

  return frag;
};
