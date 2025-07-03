import type { MaybeReactive } from '@ben-js/reactivity';
import type { Component } from '../component';

/**
 * Represents an awaitable component.
 */
export type AwaitableComponent = Component | Promise<Component>;

/**
 * Represents any component.
 */
export type AnyComponent = MaybeReactive<AwaitableComponent>;
