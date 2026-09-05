import {$Sym, NakedSym, naked} from '../store.js'

let ReflectGet = Reflect.get
let ReflectSet = Reflect.set
let ReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor
let hasOwn = Object.hasOwn
let isArray = Array.isArray

export let proxifyObj = ($, obj) => {
	if (obj[$Sym] === $) {
		return obj
	}

	let [proxify, cache, writeSubs, readSubs] = $
	let isArr = isArray(obj)

	let proxy = new Proxy(obj, {
		get(obj, prop, receiver) {
			if (typeof prop === 'symbol') {
				if (prop === $Sym) {
					return $
				}

				if (prop === NakedSym) {
					return obj
				}
			}

			let val = ReflectGet(obj, prop, receiver)

			for (let cb of readSubs) {
				cb(obj, prop)
			}

			return proxify($, val)
		},

		set(obj, prop, value, receiver) {
			$[4] && "store locked!"()

			value = naked($, value)

			let desc = ReflectGetOwnPropertyDescriptor(obj, prop)
			let writable = desc && desc.writable
			let prev = writable && desc.value

			// own data prop
			if (writable && receiver === proxy) {
				if (value === prev) {
					return true
				}

				obj[prop] = value

				for (let cb of writeSubs) {
					cb(obj, prop)
				}

				return true
			}

			// accessor, non-writable, inherited prop, new prop,
			// outer proxy, our proxy as prototype, foreign receiver

			let prevArrLen = isArr && !desc && ReflectGet(obj, 'length', proxy)
			let res = ReflectSet(obj, prop, value, receiver)

			let accessorOrNonWritable = desc && !writable
			if (accessorOrNonWritable || !res) {
				return res
			}

			// inherited prop, new prop, outer proxy, our proxy as prototype,
			// foreign receiver

			if (
				writeSubs.size && (
				writable
					? ReflectGet(obj, prop, proxy) !== prev
					: hasOwn(obj, prop)
			)) {
				let arrLenChanged = isArr && !desc &&
					ReflectGet(obj, 'length', proxy) !== prevArrLen

				for (let cb of writeSubs) {
					cb(obj, prop)

					if (arrLenChanged) {
						cb(obj, 'length')
					}
				}
			}

			return true
		},

		deleteProperty(obj, prop) {
			$[4] && "store locked!"()

			let has = prop in obj
			if (!has) return true

			delete obj[prop]

			for (let cb of writeSubs) {
				cb(obj, prop)
			}

			return true
		},
	})

	cache.set(obj, proxy)

	return proxy
}
