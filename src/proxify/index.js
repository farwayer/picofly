import {proxifyObj} from './obj.js'
import {proxifyMap} from './map.js'
import {proxifySet} from './set.js'
import {RefSym} from './ref.js'

export let obj = ($, val) =>
	typeof val === 'object' && val
		? $[1].get(val) ?? proxifyObj($, val)
		: val

export let objIgnoreSpecials = ($, val) => {
	if (typeof val !== 'object' || !val) {
		return val
	}

	let proxy = $[1].get(val)
	if (proxy) {
		return proxy
	}

	return (
		val instanceof Date ||
		val instanceof Error ||
		val instanceof RegExp ||
		val instanceof Map ||
		val instanceof Set ||
		val instanceof WeakMap ||
		val instanceof WeakSet ||
		val instanceof ArrayBuffer ||
		val instanceof Number ||
		val instanceof String ||
		val instanceof Promise ||
		val instanceof File ||
		isTypedArray(val) ||
		(typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
		(typeof Node !== 'undefined' && val instanceof Node)
			? val
			: proxifyObj($, val)
	)
}


export let map = ($, val) =>
	val instanceof Map
		? $[1].get(val) ?? proxifyMap($, val)
		: val

export let objMap = ($, val) => {
	if (typeof val !== 'object' || !val) {
		return val
	}

	let proxy = $[1].get(val)
	if (proxy) {
		return proxy
	}

	return val instanceof Map
		? proxifyMap($, val)
		: proxifyObj($, val)
}

export let objMapIgnoreSpecials = ($, val) => {
	if (typeof val !== 'object' || !val) {
		return val
	}

	let proxy = $[1].get(val)
	if (proxy) {
		return proxy
	}

	if (
		val instanceof Date ||
		val instanceof Error ||
		val instanceof RegExp ||
		val instanceof Set ||
		val instanceof WeakMap ||
		val instanceof WeakSet ||
		val instanceof ArrayBuffer ||
		val instanceof Number ||
		val instanceof String ||
		val instanceof Promise ||
		val instanceof File ||
		isTypedArray(val) ||
		(typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
		(typeof Node !== 'undefined' && val instanceof Node)
	) {
		return val
	}

	return val instanceof Map
		? proxifyMap($, val)
		: proxifyObj($, val)
}

export let objMapIgnoreSpecialsRef = ($, val) => {
	if (typeof val !== 'object' || !val) {
		return val
	}

	let proxy = $[1].get(val)
	if (proxy) {
		return proxy
	}

	let refs = $[RefSym]
	if (refs && refs.has(val)) {
		return val
	}

	if (
		val instanceof Date ||
		val instanceof Error ||
		val instanceof RegExp ||
		val instanceof Set ||
		val instanceof WeakMap ||
		val instanceof WeakSet ||
		val instanceof ArrayBuffer ||
		val instanceof Number ||
		val instanceof String ||
		val instanceof Promise ||
		val instanceof File ||
		isTypedArray(val) ||
		(typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
		(typeof Node !== 'undefined' && val instanceof Node)
	) {
		return val
	}

	return val instanceof Map
		? proxifyMap($, val)
		: proxifyObj($, val)
}

export let objMapSetIgnoreSpecialsRef = ($, val) => {
	if (typeof val !== 'object' || !val) {
		return val
	}

	let proxy = $[1].get(val)
	if (proxy) {
		return proxy
	}

	let refs = $[RefSym]
	if (refs && refs.has(val)) {
		return val
	}

	if (val instanceof Map) {
		return proxifyMap($, val)
	}

	if (val instanceof Set) {
		return proxifySet($, val)
	}

	return (
		val instanceof Date ||
		val instanceof Error ||
		val instanceof RegExp ||
		val instanceof WeakMap ||
		val instanceof WeakSet ||
		val instanceof ArrayBuffer ||
		val instanceof Number ||
		val instanceof String ||
		val instanceof Promise ||
		val instanceof File ||
		isTypedArray(val) ||
		(typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
		(typeof Node !== 'undefined' && val instanceof Node)
	)
		? val
		: proxifyObj($, val)
}

let isTypedArray = ArrayBuffer.isView
