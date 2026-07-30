import { ctx, reactive, type ReadonlyReactive } from './reactive'

export const derived = <T>(effect: DerivedEffect<T>): ReadonlyReactive<T> => {
  const rx = reactive(effect())

  ctx(() => {
    rx.value = effect()
  })

  return rx
}

export type DerivedEffect<T = unknown> = () => T
