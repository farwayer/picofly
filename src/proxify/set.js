import {$Sym, NakedSym, naked} from '../store.js'

let ReflectGet = Reflect.get
let ReflectDefineProperty = Reflect.defineProperty
let SymbolIterator = Symbol.iterator
let SymbolFor = Symbol.for
let ArrayFrom = Array.from

export let SizeSym = SymbolFor('size')

export let proxifySet = ($, set) => {
	if (set[$Sym] === $) {
		return set
	}

	let [proxify, cache, writeSubs, readSubs] = $

	let proxy = new Proxy(set, {
		get(set, prop, receiver) {
			let val, objProp, iterateEntry

			switch (prop) {
				case $Sym: {
					return $
				}

				case NakedSym: {
					return set
				}

				case 'size': {
					val = set.size
					prop = SizeSym
				}
				break

				case 'has': val = function (value) {
					value = naked($, value)

					let target = this === receiver ? set : this
					let has = target.has(value)

					for (let cb of readSubs) {
						cb(set, value)
					}

					return has
				}
				break

				case 'entries':
					iterateEntry = true
				case 'keys':
				case 'values':
				case SymbolIterator: val = function () {
					let target = this === receiver ? set : this
					let valuesIt = target.values()

					for (let cb of readSubs) {
						cb(set, SizeSym)
					}

					return {
						[SymbolIterator]() {
							return this
						},
						next() {
							let next = valuesIt.next()

							if (!next.done) {
								let nextValue = proxify($, next.value)
								next.value = iterateEntry ? [nextValue, nextValue] : nextValue
							}

							return next
						},
					}
				}
				break

				case 'forEach': val = function (cb, thisArg) {
					let target = this === receiver ? set : this

					for (let cb of readSubs) {
						cb(set, SizeSym)
					}

					target.forEach(value => {
						value = proxify($, value)
						cb(value, value, this)
					}, thisArg)
				}
				break

				case 'delete': val = function (value) {
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
				break

				case 'clear': val = function () {
					$[4] && "store locked!"()

					let target = this === receiver ? set : this
					if (!target.size) return

					// because values() returns iterator
					// it will be empty after clear
					// so we need to save all values first
					// may be slow and takes memory (depending on set size and values)
					// but anyway clear() should not be often operation
					let values = ArrayFrom(target.values())

					target.clear()

					for (let cb of writeSubs) {
						cb(set, SizeSym)

						for (let value of values) {
							cb(set, value)
						}
					}
				}
				break

				case 'add': val = function (value) {
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
				break

				// Set is js object so it's possible to get some props
				default: {
					val = ReflectGet(set, prop, receiver)
					objProp = true
				}
			}

			if (readSubs.size) {
				// to differ set values and set object props (set.add('x') vs set.x)
				if (typeof prop !== 'symbol') {
					prop = SymbolFor(prop)
				}

				for (let cb of readSubs) {
					cb(set, prop)
				}
			}

			return objProp
				? proxify($, val)
				: val
		},

		// Set is js object so it's possible to define some props
		defineProperty(set, prop, desc) {
			$[4] && "store locked!"()

			// in theory prop getter (prev or next) can modify object
			// so we need to use Reflect with the proxy as receiver
			// to catch this changes

			let has = prop in set
			let prev = has && ReflectGet(set, prop, proxy)

			desc.value = naked($, desc.value)

			if (!ReflectDefineProperty(set, prop, desc)) {
				return false
			}

			let next = has && ReflectGet(set, prop, proxy)

			if (!has || next !== prev) {
				// to differ set keys and set object props (set.add('x') vs set.x)
				if (typeof prop !== 'symbol') {
					prop = SymbolFor(prop)
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

			// to differ set keys and set object props (set.add('x') vs set.x)
			if (typeof prop !== 'symbol') {
				prop = SymbolFor(prop)
			}

			for (let cb of writeSubs) {
				cb(set, prop)
			}

			return true
		},
	})

	cache.set(set, proxy)

	return proxy
}
