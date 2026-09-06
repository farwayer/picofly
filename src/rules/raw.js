import {get$} from '../store.js'

export let RawSym = /* @__PURE__ */ Symbol()

// 39 bc
export let raw = next => !next ? 10 : ($, val) =>
	$[RawSym]?.has(val)
	  ? val
	  : next($, val)

export let markRaw = (store, val) =>
	typeof val === 'object' && val
		? ((get$(store)[RawSym] ??= new WeakSet()).add(val), val)
		: val

export let isRaw = (store, val) =>
	!!(
		typeof val === 'object' && val &&
		get$(store)[RawSym]?.has(val)
	)
