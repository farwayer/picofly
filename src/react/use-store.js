import {
	createContext, useContext, useCallback, useRef, useInsertionEffect,
	useSyncExternalStore,
} from 'react'
import {onWrite, onRead, lock, unlock, get$} from '../store.js'

export let ReactSym = /* @__PURE__ */ Symbol()

export let PicoflyContext
export let Picofly = /* @__PURE__ */ (() => (
	PicoflyContext ??= createContext()
).Provider)()
export let useContextStore = () => useContext(PicoflyContext)

export let useStore = (store = useContextStore() || "use <Picofly>"()) => {
	// store will be locked to change immediately after the call
	// and unlocked at any (!) component commit stage
	lock(store)

	let state = useRef().current ??= {
		epoch: 0,
		writeUnsubs: [],
	}
	let writeUnsubs = state.writeUnsubs
	let tracked = new WeakMap()

	let $react = attachWriteBroker(store)
	let brokerWriteSubs = $react.brokerWriteSubs

	// tracking
	let stopTrackRead = () => {
		if ($react.readUnsub) {
			$react.readUnsub()
			$react.readUnsub = null
			unlock(store)
		}
	}

	let stopTrackWrite = () => {
		let len = writeUnsubs.length
		if (len) {
			for (let i = 0; i < len; i++) {
				writeUnsubs[i]()
			}
			writeUnsubs.length = 0
		}
	}

	let updateIfTrackedKey = (obj, key) => {
		if (tracked.get(obj).has(key)) {
			stopTrackWrite()
			state.epoch++
			state.onChange?.()
		}
	}

	// 93 bc
	let trackKey = (obj, key) => {
		let trackedKeys = tracked.get(obj)

		if (!trackedKeys) {
			tracked.set(obj, trackedKeys = new Set())

			let unsub = onObjWrite(brokerWriteSubs, obj, updateIfTrackedKey)
			writeUnsubs.push(unsub)
		}

		trackedKeys.add(key)
	}

	stopTrackWrite()

	// remove previous component read callback (if exists) and attach our
	$react.readUnsub?.()
	$react.readUnsub = onRead(store, trackKey)

	let subscribe = useCallback(onChange => {
		state.onChange = onChange

		return () => {
			stopTrackWrite()
			state.epoch++
		}
	}, [])

	let getEpoch = () => state.epoch

	useSyncExternalStore(subscribe, getEpoch, getEpoch)
	useInsertionEffect(stopTrackRead)
	// due to the asynchronous nature of rendering
	// useInsertionEffect may not always be called after each render
	// (for ex. when the data was updated between the render and commit stages)
	// we should schedule cleanup so as not to miss such a situation
	queueMicrotask(stopTrackRead)

	return store
}


// attach the store write broker (one for all components)
let attachWriteBroker = (store) => {
	let $ = get$(store)
	let $react = $[ReactSym]

	if (!$react) {
		let brokerWriteSubs = new WeakMap()
		$react = $[ReactSym] = {brokerWriteSubs}

		// 39 bc
		onWrite(store, (obj, key) => {
			let objSubs = brokerWriteSubs.get(obj)
			if (objSubs) {
				notifyKey(objSubs, obj, key)
			}
		})
	}

	return $react
}

let notifyKey = (subs, obj, key) => {
	for (let cb of subs) {
		cb(obj, key)
	}
}

let onObjWrite = (writeSubs, obj, cb) => {
	let objSubs = writeSubs.get(obj)

	if (!objSubs) {
		writeSubs.set(obj, objSubs = new Set())
	}
	objSubs.add(cb)

	return () => {
		objSubs.delete(cb)

		if (!objSubs.size) {
			writeSubs.delete(obj)
		}
	}
}
