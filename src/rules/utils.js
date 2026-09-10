import {IProxify} from '../store.js'

export let SizeSym = /* @__PURE__ */ Symbol.for('size')
export let KeysSym = /* @__PURE__ */ Symbol('keys')
export let ValuesSym = /* @__PURE__ */ Symbol('values')

let SingleIterProto = /* @__PURE__ */ (() => ({
	__proto__: Iterator.prototype,

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[IProxify]
			let val = next.value

			next.value = proxify($, val)
		}

		return next
	}
}))()

export let EntriesIterProto = /* @__PURE__ */ (() => ({
	__proto__: Iterator.prototype,

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[IProxify]
			let val = next.value

			next.value = [
				proxify($, val[0]),
				proxify($, val[1]),
			]
		}

		return next
	}
}))()

export let PairIterProto = /* @__PURE__ */ (() => ({
	__proto__: Iterator.prototype,

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[IProxify]
			let val = next.value

			val = proxify($, val)
			next.value = [val, val]
		}

		return next
	}
}))()

export let iter = ($, it, proto) => {
	let wrapped = Object.create(proto || SingleIterProto)
	wrapped.$ = $
	wrapped.it = it
	return wrapped
}

// convert Map/Set as object property names to Symbol
export let msPropToKey = prop =>
	typeof prop === 'symbol'
		? prop
		: Symbol.for(prop)
