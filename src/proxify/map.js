import {$Sym, NakedSym, naked} from '../store.js'

let ReflectGet = Reflect.get
let ReflectSet = Reflect.set
let ReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor
let hasOwn = Object.hasOwn
let SymbolIterator = Symbol.iterator
let SymbolFor = Symbol.for
let ArrayFrom = Array.from

export let SizeSym = SymbolFor('size')
export let ValuesSym = Symbol('values')
export let EntriesSym = Symbol('entries')

export let proxifyMap = ($, map) => {
	if (map[$Sym] === $) {
		return map
	}

	let [proxify, cache, writeSubs, readSubs] = $

	let proxy = new Proxy(map, {
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

					return {
						[SymbolIterator]() {
							return this
						},
						next() {
							let next = keysIt.next()

							if (!next.done) {
								next.value = proxify($, next.value)
							}

							return next
						},
					}
				}

				case 'values': return function () {
					let target = this === receiver ? map : this
					let valuesIt = target.values()

					for (let cb of readSubs) {
						cb(map, ValuesSym)
					}

					return {
						[SymbolIterator]() {
							return this
						},
						next() {
							let next = valuesIt.next()

							if (!next.done) {
								next.value = proxify($, next.value)
							}

							return next
						},
					}
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
						cb(map, EntriesSym)
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

					if (has && value === prev) {
						return this
					}

					target.set(key, value)

					for (let cb of writeSubs) {
						if (!has) {
							cb(map, SizeSym)
						}
						cb(map, ValuesSym)
						cb(map, EntriesSym)
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
						cb(map, EntriesSym)
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
					let keys = ArrayFrom(target.keys())

					target.clear()

					for (let cb of writeSubs) {
						cb(map, SizeSym)
						cb(map, ValuesSym)
						cb(map, EntriesSym)

						for (let key of keys) {
							cb(map, key)
						}
					}
				}

				case 'entries':
				// string === symbol is slow, must be the last!
				case SymbolIterator: return function () {
					let target = this === receiver ? map : this
					let entriesIt = target.entries()

					for (let cb of readSubs) {
						cb(map, EntriesSym)
					}

					return {
						[SymbolIterator]() {
							return this
						},
						next() {
							let next = entriesIt.next()

							if (!next.done) {
								let [key, value] = next.value
								next.value = [
									proxify($, key),
									proxify($, value),
								]
							}

							return next
						}
					}
				}

				// Map is js object so it's possible to get some props
				default: {
					val = proxify($, ReflectGet(map, prop, receiver))

					if (typeof prop !== 'symbol' && readSubs.size) {
						prop = SymbolFor(prop)
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

			let desc = ReflectGetOwnPropertyDescriptor(map, prop)
			let writable = desc && desc.writable
			let prev = writable && desc.value

			// own data prop
			if (writable && receiver === proxy) {
				if (value === prev) {
					return true
				}

				map[prop] = value

				if (writeSubs.size) {
					// to differ map keys and map object props (map.get('x') vs map.x)
					if (typeof prop !== 'symbol') {
						prop = SymbolFor(prop)
					}

					for (let cb of writeSubs) {
						cb(map, prop)
					}
				}

				return true
			}

			// accessor, non-writable, inherited prop, new prop,
			// outer proxy, our proxy as prototype, foreign receiver

			let res = ReflectSet(map, prop, value, receiver)

			let accessorOrNonWritable = desc && !writable
			if (accessorOrNonWritable || !res) {
				return res
			}

			// inherited prop, new prop, outer proxy, our proxy as prototype,
			// foreign receiver

			if (
				writeSubs.size && (
				writable
					? ReflectGet(map, prop, proxy) !== prev
					: hasOwn(map, prop)
			)) {
				// to differ map keys and map object props (map.get('x') vs map.x)
				if (typeof prop !== 'symbol') {
					prop = SymbolFor(prop)
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

			let has = prop in map
			if (!has) return true

			delete map[prop]

			if (writeSubs.size) {
				// to differ map keys and map object props (map.get('x') vs map.x)
				if (typeof prop !== 'symbol') {
					prop = SymbolFor(prop)
				}

				for (let cb of writeSubs) {
					cb(map, prop)
				}
			}

			return true
		},
	})

	cache.set(map, proxy)

	return proxy
}
