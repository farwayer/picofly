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
export type Callback = (obj: object, key: string | symbol) => void

export function create<S>(initValue: S, proxify: Proxify<any>): S
export function ref<S, V>(store: S, val: V): V
export function isRef<S, V>(store: S, val: V): V
export function onWrite<S>(store: S, cb: Callback): void
export function onRead<S>(store: S, cb: Callback): void
export function lock<S>(store: S): void
export function unlock<S>(store: S): void
export function isLocked<S>(store: S): boolean

export let obj: Proxify<any>
export let objIgnoreSpecials: Proxify<any>
export let map: Proxify<any>
export let objMap: Proxify<any>
export let objMapIgnoreSpecials: Proxify<any>
export let objMapIgnoreSpecialsRef: Proxify<any>
