export function create<S>(state: S): S
export function store<S>(state: S, rules: Rule[]): S
export function markRaw<S, V>(store: S, val: V): V
export function isRaw<S, V>(store: S, val: V): boolean
export function onWrite<S>(store: S, cb: Sub): Unsub
export function onRead<S>(store: S, cb: Sub): Unsub
export function lock<S>(store: S): Locked
export function unlock<S>(store: S): Locked
export function isLocked<S>(store: S): boolean

export const raw: Rule // priority: 10
export const map: Rule // priority: 20
export const set: Rule // priority: 30
export const builtins: Rule // priority: 40
export const obj: Rule // priority: 50

export type Sub = (obj: object, key: unknown) => void
export type Unsub = () => void

// takes the value or passes it to the next step
export type Step = ($: $, val: any) => any

// must return priority if called without the next
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

export const IProxify: number
export const IWriteSubs: number
export const IReadSubs: number
export const ICache: number
export const ILocked: number

// don't rely on the sequence: it may be changed from version to version
// use I* indexes
export type $ = [
	proxify: Step,
	writeSubs: Set<Sub>,
	readSubs: Set<Sub>,
	cache: WeakMap<object, object>,
	locked: Locked,
]
