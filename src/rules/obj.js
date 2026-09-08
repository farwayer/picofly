import {$Sym, NakedSym, naked} from '../store.js'

// 12 bc
export let obj = next => !next ? 50 : ($, val) =>
	proxifyObj($, val)

let proxifyObj = ($, obj) => {
	let [proxify, writeSubs, readSubs] = $
	let proxy, isArr = Array.isArray(obj)

	return proxy = new Proxy(obj, {
		get(obj, prop, receiver) {
			if (typeof prop === 'symbol') {
				if (prop === $Sym) {
					return $
				}

				if (prop === NakedSym) {
					return obj
				}
			}

			let val = Reflect.get(obj, prop, receiver)

			for (let cb of readSubs) {
				cb(obj, prop)
			}

			return proxify($, val)
		},

		set(obj, prop, value, receiver) {
			$[4] && "store locked!"()

			value = naked($, value)

			let desc = Reflect.getOwnPropertyDescriptor(obj, prop)
			let writable = desc && desc.writable
			let prev = writable && desc.value

			// own data prop
			if (writable && receiver === proxy) {
				if (Object.is(value, prev)) {
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

			let prevArrLen = isArr && !desc && Reflect.get(obj, 'length', proxy)
			let res = Reflect.set(obj, prop, value, receiver)

			let accessorOrNonWritable = desc && !writable
			if (accessorOrNonWritable || !res) {
				return res
			}

			// inherited prop, new prop, outer proxy, our proxy as prototype,
			// foreign receiver

			if (
				writeSubs.size && (
				writable
					? !Object.is(Reflect.get(obj, prop, proxy), prev)
					: Object.hasOwn(obj, prop) // new
			)) {
				let arrLenChanged = isArr && !desc &&
					Reflect.get(obj, 'length', proxy) !== prevArrLen

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

			if (!Object.hasOwn(obj, prop)) {
				return true
			}

			if (!Reflect.deleteProperty(obj, prop)) {
				return false
			}

			for (let cb of writeSubs) {
				cb(obj, prop)
			}

			return true
		},
	})
}
