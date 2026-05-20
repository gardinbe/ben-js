import { ctx, type Reactive, reactive } from './reactive'

export const derived = <T>(effect: DerivedEffect<T>): Derived<T> => {
  const rx = reactive(effect())

  ctx(() => {
    rx.value = effect()
  })

  return rx
}

export type Derived<T> = {
  readonly value: T
} & Reactive<T>

export type DerivedEffect<T> = () => T
