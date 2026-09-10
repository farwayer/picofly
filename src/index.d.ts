export function create<S>(state: S): S
export function store<S>(state: S, rules: Rule[]): S
export function markRaw<S, V>(store: S, val: V): V
export function isRaw<S, V>(store: S, val: V): boolean
export function onWrite<S>(store: S, cb: Sub): Unsub
export function onRead<S>(store: S, cb: Sub): Unsub
export function lock<S>(store: S): void
export function unlock<S>(store: S): void
export function isLocked<S>(store: S): boolean

export const raw: Rule
export const map: Rule
export const set: Rule
export const builtins: Rule
export const obj: Rule

export type Sub = (obj: object, key: unknown) => void
export type Unsub = () => void

// takes the value or passes it to the next step
export type Step = ($: $, val: any) => any

// returns priority if called without the next step
export type Rule = (next?: Step) => number | Step


// internal
export const $Sym: unique symbol
export const NakedSym: unique symbol
export const RawSym: unique symbol
export const SizeSym: unique symbol
export const ValuesSym: unique symbol
export function get$<S>(store: S): $
export function naked<V>($: $, val: V): V

export type Locked = 1 | 0
export type $ = [
	proxify: Step,
	writeSubs: Set<Sub>,
	readSubs: Set<Sub>,
	cache: WeakMap<object, object>,
	locked: Locked,
]
