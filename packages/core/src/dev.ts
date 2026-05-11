import { Component, type ComponentDevState } from './component';
import { createError, ErrorType } from './error';
import type { Enum } from './utils';

export let IS_DEV = false;

export const enableDevMode = () => {
  IS_DEV = true;
};

export const getCallerFunctionName = (): string | null => {
  const stack = new Error().stack;

  if (!stack) {
    return null;
  }

  const names = stack
    .split('\n')
    .slice(3)
    .map((line) => line.match(/at\s+(?:(.*?)\s+\()?[^()]*\)?$/)?.[1]?.trim() ?? null);

  let closestNamedFunction: string | null = null;

  for (const name of names) {
    if (name && name !== '<anonymous>') {
      closestNamedFunction = name;
      break;
    }
  }

  if (!closestNamedFunction) {
    return null;
  }

  const nearestName = names[0];

  if (!nearestName || nearestName === '<anonymous>') {
    return `${closestNamedFunction}<anonymous>`;
  }

  return nearestName;
};

export const printTree = (component: Component) => {
  if (!IS_DEV) {
    throw createError(ErrorType.DEV_MODE_NOT_ENABLED);
  }

  const lines: string[] = [];
  const colors: string[] = [];

  const walk = (component: Component, indent = '') => {
    const childIndent = `${indent}  `;

    for (const child of component._dev!.children) {
      lines.push(`${childIndent}${child._dev!.name}`);
      colors.push(`color:${child._dev!.color}`);
      walk(child, childIndent);
    }
  };

  walk(component);

  console.log(lines.map((line) => `%c${line}`).join('\n'), ...colors);
};

export const randomHexColor = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;

export type ComponentType = Enum<typeof ComponentType>;
export const ComponentType = {
  STATIC: 'Static',
  DYNAMIC: 'Dynamic',
  SWAP: 'Swap',
} as const;

export type LogEventType = Enum<typeof LogEventType>;
export const LogEventType = {
  CONNECTED: 0,
  DISCONNECTED: 1,
  DESTROYED: 2,
} as const;

const getLogSymbol = (type: LogEventType) => {
  switch (type) {
    case LogEventType.CONNECTED:
      return {
        symbol: '➕',
        color: '#0F0',
      };
    case LogEventType.DISCONNECTED:
      return {
        symbol: '➖',
        color: '#0FF',
      };
    case LogEventType.DESTROYED:
      return {
        symbol: '❌',
        color: '#F00',
      };
  }
};

export const logEvent = (type: LogEventType, DEV: ComponentDevState | null) => {
  if (!IS_DEV || !DEV) {
    return;
  }

  const { symbol, color } = getLogSymbol(type);
  console.log(`%c${symbol} %c${DEV.name} (${DEV.type})`, `color:${color}`, `color:${DEV.color}`);
};
