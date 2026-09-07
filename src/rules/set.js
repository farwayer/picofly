import {$Sym, NakedSym, naked} from '../store.js'
import {SizeSym, PairIterProto, iter} from './utils.js'

// 30 bc
export let set = next => !next ? 30 : ($, val) =>
	val instanceof Set
		? proxifySet($, val)
		: next($, val)

let proxifySet = ($, set) => {
	let [proxify, writeSubs, readSubs] = $
	let proxy

	return proxy = new Proxy(set, {
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

				case 'forEach': return function (cb, thisArg) {
					let target = this === receiver ? set : this

					for (let cb of readSubs) {
						cb(set, SizeSym)
					}

					target.forEach(value => {
						value = proxify($, value)
						cb(value, value, this)
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

					if (values) {
						for (let cb of writeSubs) {
							cb(set, SizeSym)

							for (let value of values) {
								cb(set, value)
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

				// Set is js object so it's possible to get some props
				default: {
					val = proxify($, Reflect.get(set, prop, receiver))

					// to differ set values and set object props (set.add('x') vs set.x)
					if (typeof prop !== 'symbol' && readSubs.size) {
						prop = Symbol.for(prop)
					}
				}
			}

			for (let cb of readSubs) {
				cb(set, prop)
			}

			return val
		},

		// Set is js object so it's possible to set some props
		set(set, prop, value, receiver) {
			$[4] && "store locked!"()

			value = naked($, value)

			let desc = Reflect.getOwnPropertyDescriptor(set, prop)
			let writable = desc && desc.writable
			let prev = writable && desc.value

			// own data prop
			if (writable && receiver === proxy) {
				if (value === prev) {
					return true
				}

				set[prop] = value

				if (writeSubs.size) {
					// to differ set keys and set object props (set.add('x') vs set.x)
					if (typeof prop !== 'symbol') {
						prop = Symbol.for(prop)
					}

					for (let cb of writeSubs) {
						cb(set, prop)
					}
				}

				return true
			}

			// accessor, non-writable, inherited prop, new prop,
			// outer proxy, our proxy as prototype, foreign receiver

			let res = Reflect.set(set, prop, value, receiver)

			let accessorOrNonWritable = desc && !writable
			if (accessorOrNonWritable || !res) {
				return res
			}

			// inherited prop, new prop, outer proxy, our proxy as prototype,
			// foreign receiver

			if (
				writeSubs.size && (
					writable
						? Reflect.get(set, prop, proxy) !== prev
						: Object.hasOwn(set, prop)
				)) {
				// to differ set keys and set object props (set.add('x') vs set.x)
				if (typeof prop !== 'symbol') {
					prop = Symbol.for(prop)
				}

				for (let cb of writeSubs) {
					cb(set, prop)
				}
			}

			return true
		},

		// Set is js object so it's possible to delete some props
		deleteProperty(set, prop) {
			$[4] && "store locked!"()

			let has = prop in set
			if (!has) return true

			delete set[prop]

			if (writeSubs.size) {
				// to differ set keys and set object props (set.add('x') vs set.x)
				if (typeof prop !== 'symbol') {
					prop = Symbol.for(prop)
				}

				for (let cb of writeSubs) {
					cb(set, prop)
				}
			}

			return true
		},
	})
}
