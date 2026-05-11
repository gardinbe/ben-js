import { derived, Reactive } from '@ben-js/reactivity';
import { Component } from '../component';
import { Swap } from './Swap';

export const When = (
  condition: (() => boolean) | Reactive<boolean>,
  component: Component,
): Component => {
  const member = typeof condition === 'function' ? derived(condition) : condition;
  return Swap(() => (member.value ? component : null));
};
