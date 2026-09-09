import {$Sym, NakedSym, naked} from '../store.js'
import {ValuesSym, EntriesIterProto, SizeSym, iter} from './utils.js'

// 30 bc
export let map = next => !next ? 20 : ($, val) =>
	val instanceof Map
		? proxifyMap($, val)
		: next($, val)

let proxifyMap = ($, map) => {
	let [proxify, writeSubs, readSubs] = $
	let proxy = null

	return proxy = new Proxy(map, {
		get(map, prop, receiver) {
			if (typeof prop === 'symbol') {
				if (prop === $Sym) {
					return $
				}

				if (prop === NakedSym) {
					return map
				}
			}

			let val

			switch (prop) {
				case 'size': {
					val = map.size
					prop = SizeSym
				}
					break

				case 'get': return function (key) {
					key = naked($, key)

					let target = this === receiver ? map : this
					let value = target.get(key)

					for (let cb of readSubs) {
						cb(map, key)
					}

					return proxify($, value)
				}

				case 'keys': return function () {
					let target = this === receiver ? map : this
					let keysIt = target.keys()

					for (let cb of readSubs) {
						cb(map, SizeSym)
					}

					return iter($, keysIt)
				}

				case 'values': return function () {
					let target = this === receiver ? map : this
					let valuesIt = target.values()

					for (let cb of readSubs) {
						cb(map, ValuesSym)
					}

					return iter($, valuesIt)
				}

				case 'has': return function (key) {
					key = naked($, key)

					let target = this === receiver ? map : this
					let has = target.has(key)

					for (let cb of readSubs) {
						cb(map, key)
					}

					return has
				}

				case 'forEach': return function (cb, thisArg) {
					let target = this === receiver ? map : this

					for (let cb of readSubs) {
						cb(map, ValuesSym)
					}

					target.forEach((value, key) => {
						cb(
							proxify($, value),
							proxify($, key),
							this,
						)
					}, thisArg)
				}

				case 'set': return function (key, value) {
					$[4] && "store locked!"()

					key = naked($, key)
					value = naked($, value)

					let target = this === receiver ? map : this
					let has = target.has(key)
					let prev = has && target.get(key)

					// not ===, +0/-0/NaN
					if (has && Object.is(value, prev)) {
						return this
					}

					target.set(key, value)

					for (let cb of writeSubs) {
						if (!has) {
							cb(map, SizeSym)
						}
						cb(map, ValuesSym)
						cb(map, key)
					}

					return this
				}

				case 'delete': return function (key) {
					$[4] && "store locked!"()

					key = naked($, key)

					let target = this === receiver ? map : this
					let has = target.has(key)
					if (!has) return false

					target.delete(key)

					for (let cb of writeSubs) {
						cb(map, SizeSym)
						cb(map, ValuesSym)
						cb(map, key)
					}

					return true
				}

				case 'clear': return function () {
					$[4] && "store locked!"()

					let target = this === receiver ? map : this
					if (!target.size) return

					// because keys() returns iterator
					// it will be empty after clear
					// so we need to save all keys first
					// may be slow and takes memory (depending on map size and keys)
					// but anyway clear() should not be often operation
					let keys = writeSubs.size && Array.from(target.keys())

					target.clear()

					if (keys) {
						for (let cb of writeSubs) {
							cb(map, SizeSym)
							cb(map, ValuesSym)

							for (let key of keys) {
								cb(map, key)
							}
						}
					}
				}

				case 'entries':
				// string === symbol is slow, must be the last!
				case Symbol.iterator: return function () {
					let target = this === receiver ? map : this
					let entriesIt = target.entries()

					for (let cb of readSubs) {
						cb(map, ValuesSym)
					}

					return iter($, entriesIt, EntriesIterProto)
				}

				// Map is js object so it's possible to get some props
				default: {
					val = proxify($, Reflect.get(map, prop, receiver))

					if (typeof prop !== 'symbol' && readSubs.size) {
						prop = Symbol.for(prop)
					}
				}
			}

			for (let cb of readSubs) {
				cb(map, prop)
			}

			return val
		},

		// Map is js object so it's possible to set some props
		set(map, prop, value, receiver) {
			$[4] && "store locked!"()

			value = naked($, value)

			let watch = writeSubs.size
			let had = prop in map
			let prev = watch && had && map[prop]

			if (
				had &&
				receiver === proxy &&
				Reflect.getOwnPropertyDescriptor(map, prop)?.writable
			) {
				map[prop] = value
			} else {
				if (!Reflect.set(map, prop, value, receiver)) {
					return false
				}
			}

			if (watch && (
				had
					// not ===, +0/-0/NaN
					? !Object.is(map[prop], prev)
					// was it actually created?
					: prop in map
			)) {
				// to differ map keys and map object props (map.get('x') vs map.x)
				if (typeof prop !== 'symbol') {
					prop = Symbol.for(prop)
				}

				for (let cb of writeSubs) {
					cb(map, prop)
				}
			}

			return true
		},

		// Map is js object so it's possible to delete some props
		deleteProperty(map, prop) {
			$[4] && "store locked!"()

			if (!Object.hasOwn(map, prop)) {
				return true
			}

			if (!Reflect.deleteProperty(map, prop)) {
				return false
			}

			if (writeSubs.size) {
				// to differ map keys and map object props (map.get('x') vs map.x)
				if (typeof prop !== 'symbol') {
					prop = Symbol.for(prop)
				}

				for (let cb of writeSubs) {
					cb(map, prop)
				}
			}

			return true
		},
	})
}
