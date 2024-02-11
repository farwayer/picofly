export type Locked = 1 | 0 | undefined
export type Sub = (obj: object, key: string | Symbol) => void
export type ReadSub = Sub
export type WriteSub = Sub
export type $<S> = [
  Proxify<S>,
  WeakMap<object, S>,
  Set<WriteSub>,
  Set<ReadSub>,
  Locked,
]
export type Proxify<S> = ($: $<S>, val: S) => S

export function createStore<S>(initValue: S, proxify: Proxify<unknown>): S
export function store<S>(initValue: S): S
export function ref<S, V>(store: S, val: V): V
export function isRef<S, V>(store: S, val: V): V

export const obj: Proxify<unknown>
export const objIgnoreSpecials: Proxify<unknown>
export const map: Proxify<unknown>
export const objMap: Proxify<unknown>
export const objMapIgnoreSpecials: Proxify<unknown>
export const objMapIgnoreSpecialsRef: Proxify<unknown>
