import {$Sym, NakedSym, naked} from '../store.js'
import {KeysSym} from './utils.js'

// 12 bc
export let obj = next => !next ? 50 : ($, val) =>
	proxifyObj($, val)

let proxifyObj = ($, obj) => {
	let [proxify, writeSubs, readSubs] = $
	let isArr = Array.isArray(obj)
	let proxy = null

	return proxy = new Proxy(obj, {
		ownKeys(obj) {
			let keys = Reflect.ownKeys(obj)

			for (let cb of readSubs) {
				cb(obj, KeysSym)
			}

			return keys
		},

		has(obj, prop) {
			let has = prop in obj

			for (let cb of readSubs) {
				cb(obj, prop)
			}

			return has
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
				cb(obj, KeysSym)
				cb(obj, prop)
			}

			return true
		},

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

			let watch = writeSubs.size
			let had = prop in obj
			let prev = watch && had && obj[prop]

			let arrWatch = watch && isArr
			let arrGrew = arrWatch && !had
			let arrPrevLen = arrGrew && obj.length

			let arrDropped = arrWatch && prop === 'length' && prev > value && []
			if (arrDropped) {
				let i = prev
				while (i-- > value) {
					if (i in obj) { // not a hole
						arrDropped.push('' + i)
					}
				}
			}

			if (
				had &&
				receiver === proxy &&
				Reflect.getOwnPropertyDescriptor(obj, prop)?.writable
			) {
				obj[prop] = value
			} else {
				if (!Reflect.set(obj, prop, value, receiver)) {
					return false
				}
			}

			if (watch && (
				had
					// not ===, +0/-0/NaN
					? !Object.is(obj[prop], prev)
					// was it actually created?
					: prop in obj
			)) {
				let arrLenChanged = arrGrew && obj.length !== arrPrevLen
				let arrDroppedLen = arrDropped ? arrDropped.length : 0
				let keysChanged = !had || arrDroppedLen

				for (let cb of writeSubs) {
					if (keysChanged) {
						cb(obj, KeysSym)
					}

					cb(obj, prop)


					for (let i = 0; i < arrDroppedLen; i++) {
						cb(obj, arrDropped[i])
					}

					if (arrLenChanged) {
						cb(obj, 'length')
					}
				}
			}

			return true
		},
	})
}
