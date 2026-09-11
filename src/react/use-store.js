import {
	createContext, useContext, useCallback, useRef, useInsertionEffect,
	useSyncExternalStore,
} from 'react'
import {onWrite, onRead, lock, unlock, get$} from '../store.js'

export let PicoflyContext
export let Picofly = /* @__PURE__ */ (() => (
	PicoflyContext ??= createContext()
).Provider)()
export let useContextStore = () => useContext(PicoflyContext)

export let useStore = (store = useContextStore() || "use <Picofly>"()) => {
	// store will be locked to change immediately after the call
	// and unlocked at any (!) component commit stage
	lock(store)

	let epochRef = useRef(0)
	let trackedRef = useRef()
	let writeUnsubsRef = useRef()
	let onChangeRef = useRef()

	let $ = get$(store)
	let $react = $[ReactSym]

	writeUnsubsRef.current ??= new Set()


	// init (once per component)
	// epoch used as inited flag
	if (!epochRef.current) {
		epochRef.current++

		// attach the store write broker (once: one for all components)
		if (!$react) {
			let brokerSubs = new WeakMap()

			let brokerUnsub = onWrite(store, (obj, key) => {
				let objSubs = brokerSubs.get(obj)
				if (!objSubs?.size) return

				for (let cb of objSubs) {
					cb(obj, key)
				}
			})

			$react = $[ReactSym] = {
				alive: 0,
				brokerSubs,
				brokerUnsub,
			}
		}

		$react.alive++
	}

	let brokerRelease = () => {
		if (!--$react.alive) {
			$react.brokerUnsub()
			delete $[ReactSym]
		}
	}


	// tracking
	let stopTrackRead = () => {
		if ($react.readUnsub) {
			$react.readUnsub()
			$react.readUnsub = null
			unlock(store)
		}
	}

	let stopTrackWrite = () => {
		let unsubs = writeUnsubsRef.current
		if (!unsubs.size) return

		for (let unsub of unsubs) {
			unsub()
		}
		unsubs.clear()
	}

	let notifyIfTrackedKey = (obj, key) => {
		if (trackedRef.current.get(obj)?.has(key)) {
			stopTrackWrite()
			epochRef.current++
			onChangeRef.current()
		}
	}

	let trackKey = (obj, key) => {
		let tracked = trackedRef.current
		let trackedKeys = tracked.get(obj)

		if (trackedKeys) {
			trackedKeys.add(key)
		} else {
			tracked.set(obj, new Set().add(key))

			let unsub = onObjWrite($react, obj, notifyIfTrackedKey)
			writeUnsubsRef.current.add(unsub)
		}
	}

	stopTrackWrite()
	trackedRef.current = new WeakMap()

	// remove previous component read callback (if exists) and attach our
	$react.readUnsub?.()
	$react.readUnsub = onRead(store, trackKey)

	let subscribe = useCallback(onChange => {
		onChangeRef.current = onChange

		return () => {
			stopTrackWrite()
			brokerRelease()
		}
	}, [$react])

	let getEpoch = () => epochRef.current

	useSyncExternalStore(subscribe, getEpoch, getEpoch)
	useInsertionEffect(stopTrackRead)

	// due to the asynchronous nature of rendering
	// useInsertionEffect may not always be called after each render
	// (for ex. when the data was updated between the render and commit stages)
	// we should schedule cleanup so as not to miss such a situation
	queueMicrotask(stopTrackRead)

	return store
}

// private
let ReactSym = Symbol()

let onObjWrite = ($react, obj, cb) => {
	let brokerSubs = $react.brokerSubs
	let objSubs = brokerSubs.get(obj)

	if (objSubs) {
		objSubs.add(cb)
	} else {
		$react.brokerSubs.set(obj, objSubs = new Set().add(cb))
	}

	return () => (
		objSubs.delete(cb)
	)
}
