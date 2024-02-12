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

export function create<S>(initValue: S, proxify: Proxify<any>): S
export function ref<S, V>(store: S, val: V): V
export function isRef<S, V>(store: S, val: V): V

export const obj: Proxify<any>
export const objIgnoreSpecials: Proxify<any>
export const map: Proxify<any>
export const objMap: Proxify<any>
export const objMapIgnoreSpecials: Proxify<any>
export const objMapIgnoreSpecialsRef: Proxify<any>
