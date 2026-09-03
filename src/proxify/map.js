import {$Sym, NakedSym, naked} from '../store.js'

let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
let SymbolIterator = Symbol.iterator
let SymbolFor = Symbol.for
let ArrayFrom = Array.from

export let SizeSym = SymbolFor('size')
export let ValuesSym = Symbol('values')
export let EntriesSym = Symbol('entries')

export let proxifyMap = ($, map) => {
	let [proxify, cache, writeSubs, readSubs] = $

	let proxy = new Proxy(map, {
		get(map, prop, receiver) {
			let val, objProp

			switch (prop) {
				case $Sym: {
					return $
				}

				case NakedSym: {
					return map
				}

				case 'size': {
					val = map.size
					prop = SizeSym
				}
				break

				case 'has': val = function (key) {
					key = naked($, key)

					let target = this === receiver ? map : this
					let has = target.has(key)

					for (let cb of readSubs) {
						cb(map, key)
					}

					return has
				}
				break

				case 'get': val = function (key) {
					key = naked($, key)

					let target = this === receiver ? map : this
					let value = target.get(key)

					for (let cb of readSubs) {
						cb(map, key)
					}

					return proxify($, value)
				}
				break

				case 'keys': val = function () {
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
				break

				case 'values': val = function () {
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
				break

				case 'entries':
				case SymbolIterator: val = function () {
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
				break

				case 'forEach': val = function (cb, thisArg) {
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
				break

				case 'delete': val = function (key) {
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
				break

				case 'clear': val = function () {
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
				break

				case 'set': val = function (key, value) {
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
				break

				// Map is js object so it's possible to get some props
				default: {
					val = ReflectGet(map, prop, receiver)
					objProp = true
				}
			}

			if (readSubs.size) {
				// to differ map keys and map object props (map.get('x') vs map.x)
				if (typeof prop !== 'symbol') {
					prop = SymbolFor(prop)
				}

				for (let cb of readSubs) {
					cb(map, prop)
				}
			}

			return objProp
				? proxify($, val)
				: val
		},

		// Map is js object so it's possible to define some props
		defineProperty(map, prop, desc) {
			$[4] && "store locked!"()

			// in theory prop getter (prev or next) can modify object
			// so we need to use Reflect with the proxy as receiver
			// to catch this changes

			let has = prop in map
			let prev = has && ReflectGet(map, prop, proxy)

			desc.value = naked($, desc.value)

			ReflectDefineProperty(map, prop, desc)

			let next = has && ReflectGet(map, prop, proxy)

			if (!has || next !== prev) {
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

			// to differ map keys and map object props (map.get('x') vs map.x)
			if (typeof prop !== 'symbol') {
				prop = SymbolFor(prop)
			}

			for (let cb of writeSubs) {
				cb(map, prop)
			}

			return true
		},
	})

	cache.set(map, proxy)

	return proxy
}
