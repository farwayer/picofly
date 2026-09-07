export let SizeSym = /* @__PURE__ */ Symbol.for('size')
export let ValuesSym = /* @__PURE__ */ Symbol('values')

let SingleIterProto = {
	[Symbol.iterator]() {
		return this
	},

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[0]
			let val = next.value

			next.value = proxify($, val)
		}

		return next
	}
}

export let EntriesIterProto = {
	[Symbol.iterator]() {
		return this
	},

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[0]
			let val = next.value

			next.value = [
				proxify($, val[0]),
				proxify($, val[1]),
			]
		}

		return next
	}
}

export let PairIterProto = {
	[Symbol.iterator]() {
		return this
	},

	next() {
		let next = this.it.next()

		if (!next.done) {
			let $ = this.$
			let proxify = $[0]
			let val = next.value

			val = proxify($, val)
			next.value = [val, val]
		}

		return next
	}
}

export let iter = ($, it, proto) => {
	let wrapped = Object.create(proto || SingleIterProto)
	wrapped.$ = $
	wrapped.it = it
	return wrapped
}
