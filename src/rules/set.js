import {$Sym, NakedSym, naked} from '../store.js'
import {PairIterProto, KeysSym, SizeSym, iter, msPropToKey} from './utils.js'

// 30 bc
export let set = next => !next ? 30 : ($, val) =>
	val instanceof Set
		? proxifySet($, val)
		: next($, val)

let proxifySet = ($, set) => {
	let [proxify, writeSubs, readSubs] = $
	let proxy = null

	// Set is js object so we must maintain its regular properties
	// we use Symbol(prop) to differ set values and set object props
	return proxy = new Proxy(set, {
		ownKeys(set) {
			let keys = Reflect.ownKeys(set)

			for (let cb of readSubs) {
				cb(set, KeysSym)
			}

			return keys
		},

		has(set, prop) {
			let has = prop in set

			if (readSubs.size) {
				prop = msPropToKey(prop)

				for (let cb of readSubs) {
					cb(set, prop)
				}
			}

			return has
		},

		deleteProperty(set, prop) {
			$[4] && "store locked!"()

			if (!Object.hasOwn(set, prop)) {
				return true
			}

			if (!Reflect.deleteProperty(set, prop)) {
				return false
			}

			if (writeSubs.size) {
				prop = msPropToKey(prop)

				for (let cb of writeSubs) {
					cb(set, KeysSym)
					cb(set, prop)
				}
			}

			return true
		},

		get(set, prop, receiver) {
			if (typeof prop === 'symbol') {
				if (prop === $Sym) {
					return $
				}

				if (prop === NakedSym) {
					return set
				}
			}

			let val, iterProto

			switch (prop) {
				case 'size': {
					val = set.size
					prop = SizeSym
				}
				break

				case 'has': return function (value) {
					value = naked($, value)

					let target = this === receiver ? set : this
					let has = target.has(value)

					for (let cb of readSubs) {
						cb(set, value)
					}

					return has
				}

				case 'add': return function (value) {
					$[4] && "store locked!"()

					value = naked($, value)

					let target = this === receiver ? set : this
					let has = target.has(value)
					if (has) return this

					target.add(value)

					for (let cb of writeSubs) {
						cb(set, SizeSym)
						cb(set, value)
					}

					return this
				}

				case 'forEach': return function (fn, thisArg) {
					let target = this === receiver ? set : this

					for (let cb of readSubs) {
						cb(set, SizeSym)
					}

					target.forEach(value => {
						value = proxify($, value)
						fn(value, value, this)
					}, thisArg)
				}

				case 'delete': return function (value) {
					$[4] && "store locked!"()

					value = naked($, value)

					let target = this === receiver ? set : this
					let has = target.has(value)
					if (!has) return false

					target.delete(value)

					for (let cb of writeSubs) {
						cb(set, SizeSym)
						cb(set, value)
					}

					return true
				}

				case 'clear': return function () {
					$[4] && "store locked!"()

					let target = this === receiver ? set : this
					if (!target.size) return

					// because values() returns iterator
					// it will be empty after clear
					// so we need to save all values first
					// may be slow and takes memory (depending on set size and values)
					// but anyway clear() should not be often operation
					let values = writeSubs.size && Array.from(target.values())

					target.clear()

					let valuesLen = values && values.length
					if (valuesLen) {
						for (let cb of writeSubs) {
							cb(set, SizeSym)

							for (let i = 0; i < valuesLen; i++) {
								cb(set, values[i])
							}
						}
					}
				}

				case 'entries':
					iterProto = PairIterProto
				// falls through
				case 'keys':
				case 'values':
				// string === symbol is slow, must be the last!
				case Symbol.iterator: return function () {
					let target = this === receiver ? set : this
					let valuesIt = target.values()

					for (let cb of readSubs) {
						cb(set, SizeSym)
					}

					return iter($, valuesIt, iterProto)
				}

				default: {
					val = proxify($, Reflect.get(set, prop, receiver))
				}
			}

			if (readSubs.size) {
				prop = msPropToKey(prop)

				for (let cb of readSubs) {
					cb(set, prop)
				}
			}

			return val
		},

		set(set, prop, value, receiver) {
			$[4] && "store locked!"()

			value = naked($, value)

			let watch = writeSubs.size
			let had = prop in set
			let prev = watch && had && set[prop]

			if (
				had &&
				receiver === proxy &&
				Reflect.getOwnPropertyDescriptor(set, prop)?.writable
			) {
				set[prop] = value
			} else {
				if (!Reflect.set(set, prop, value, receiver)) {
					return false
				}
			}

			if (watch && (
				had
					// not ===, +0/-0/NaN
					? !Object.is(set[prop], prev)
					// was it actually created?
					: prop in set
			)) {
				prop = msPropToKey(prop)

				for (let cb of writeSubs) {
					if (!had) {
						cb(set, KeysSym)
					}

					cb(set, prop)
				}
			}

			return true
		},
	})
}
