import { isReactive, type Reactive, subscribe, unsubscribe } from '@ben-js/reactivity';

import { isRef, type Ref } from '../ref';
import { getCallerFunctionName } from '../dev';
import { isStatic } from '../static';
import {
  ANONYMOUS_COMPONENT_NAME,
  COMPONENT_CHILD_MARKER,
  type Component,
  COMPONENT_MARKER,
  ComponentSymbol,
  type ComponentHookFunction,
  type ComponentDevState,
  inDocument,
  isComponent,
  type ComponentUsePayload,
  type ComponentMountTarget,
  getMountNodes,
} from '../component';
import { ComponentType, IS_DEV, logEvent, LogEventType, randomHexColor } from '../dev';
import { createError, ErrorType } from '../error';

export const html = (strings: TemplateStringsArray, ...values: unknown[]): Component => {
  const parts: TemplateParts = {
    strings,
    values,
  };

  let nodes: ChildNode[] | null = null;
  let content: ComponentContent | null = null;

  const marker = document.createComment(COMPONENT_MARKER);
  let isMounted = false;

  const hooks = {
    connected: new Set<ComponentHookFunction>(),
    disconnected: new Set<ComponentHookFunction>(),
  };

  const DEV: ComponentDevState | null = IS_DEV
    ? {
        name: getCallerFunctionName() ?? ANONYMOUS_COMPONENT_NAME,
        get children() {
          return [...(content?.components ?? [])];
        },
        color: randomHexColor(),
        type: ComponentType.STATIC,
      }
    : null;

  const mount = (node: ComponentMountTarget) => {
    const { target, parent } = getMountNodes(node, DEV);
    parent.replaceChild(marker, target);

    if (nodes) {
      nodes.forEach((node) => {
        parent.insertBefore(node, marker);
      });
    } else {
      render();
    }

    if (!inDocument(marker)) {
      setDisconnected();
      return;
    }

    setConnected();
  };

  const setConnected = () => {
    if (isMounted) {
      return;
    }

    content?.components.forEach((component) => {
      component.setConnected();
    });

    logEvent(LogEventType.CONNECTED, DEV);
    hooks.connected.forEach((fn) => {
      fn();
    });

    isMounted = true;
  };

  const setDisconnected = () => {
    if (!isMounted) {
      return;
    }

    content?.components.forEach((component) => {
      component.setDisconnected();
    });

    logEvent(LogEventType.DISCONNECTED, DEV);
    hooks.disconnected.forEach((fn) => {
      fn();
    });

    isMounted = false;
  };

  const unmount = () => {
    if (!nodes) {
      return;
    }

    nodes.forEach((node) => {
      node.remove();
    });
    marker.remove();
  };

  const applyContent = (next?: ComponentContent): void => {
    withDifference(content?.reactives, next?.reactives, (rx) => {
      unsubscribe(rx, render);
    });

    withDifference(content?.refs, next?.refs, (ref) => {
      ref.set(null);
    });

    withDifference(content?.components, next?.components, (component) => {
      component.destroy();
    });

    withDifference(next?.reactives, content?.reactives, (rx) => {
      subscribe(rx, render);
    });
  };

  const destroy = () => {
    applyContent();
    content = null;
    unmount();
    setDisconnected();
    nodes = null;
    logEvent(LogEventType.DESTROYED, DEV);
  };

  const isSameContent = (next: ComponentContent): boolean =>
    !!content &&
    next.html === content.html &&
    next.components.symmetricDifference(content.components).size === 0 &&
    next.reactives.symmetricDifference(content.reactives).size === 0 &&
    next.refs.symmetricDifference(content.refs).size === 0;

  const render = () => {
    const nextContent = createContent(parts);

    if (isSameContent(nextContent)) {
      return;
    }

    applyContent(nextContent);
    content = nextContent;
    const frag = createFragment(nextContent, DEV);

    nodes?.forEach((node) => {
      node.remove();
    });
    nodes = [...frag.childNodes];
    marker.parentNode?.insertBefore(frag, marker);
  };

  const hook = (payload: ComponentUsePayload) => {
    if (payload.connected) {
      hooks.connected.add(payload.connected);
    }

    if (payload.disconnected) {
      hooks.disconnected.add(payload.disconnected);
    }

    return c;
  };

  const c: Component = {
    [ComponentSymbol]: true,
    mount,
    unmount,
    destroy,
    hook,
    setConnected,
    setDisconnected,
  };

  if (DEV) {
    c._dev = DEV;
  }

  return c;
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

type TemplateParts = {
  strings: TemplateStringsArray;
  values: unknown[];
};

type ComponentContent = {
  components: Set<Component>;
  html: string;
  reactives: Set<Reactive>;
  refs: Set<Ref>;
};

const createContent = (parts: TemplateParts): ComponentContent => {
  const reactives = new Set<Reactive>();
  const components = new Set<Component>();
  const refs = new Set<Ref>();

  const parseValue = (value: unknown): string => {
    if (Array.isArray(value)) {
      return value.map((item) => parseValue(item)).join('');
    }

    if (isReactive(value)) {
      reactives.add(value);
      return parseValue(value.value);
    }

    if (isStatic(value)) {
      return parseValue(value.value);
    }

    if (isComponent(value)) {
      components.add(value);
      return `<!--${COMPONENT_CHILD_MARKER}-->`;
    }

    if (isRef(value)) {
      refs.add(value);
      return value.uuid;
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

const stringify = (value: unknown): string => (value != null && value !== false ? `${value}` : '');

const createFragment = (
  content: ComponentContent,
  DEV: ComponentDevState | null,
): DocumentFragment => {
  const tpl = document.createElement('template');
  tpl.innerHTML = content.html;
  const frag = tpl.content;

  content.refs.forEach((ref) => {
    const el = frag.querySelector<HTMLElement>(`[ref='${ref.uuid}']`);

    if (!el) {
      throw createError(ErrorType.MISSING_REF_TARGET, DEV);
    }

    el.removeAttribute('ref');
    ref.set(el);
  });

  const markers = getMarkers(frag, COMPONENT_CHILD_MARKER);

  if (markers.length !== content.components.size) {
    throw createError(ErrorType.COMPONENT_MARKER_MISMATCH, DEV);
  }

  markers.forEach((marker, i) => {
    [...content.components][i]!.mount(marker);
  });

  return frag;
};

const getMarkers = (root: Node, text: string): Comment[] => {
  const markers: Comment[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);

  let node: Node | null;

  while ((node = walker.nextNode())) {
    if (node.textContent !== text) {
      continue;
    }

    markers.push(node as Comment);
  }

  return markers;
};
