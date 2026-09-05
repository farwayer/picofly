import {
	createContext, useContext, useCallback, useRef, useInsertionEffect,
	useSyncExternalStore,
} from 'react'
import {onWrite, onRead, lock, unlock, get$} from '../store.js'

export let PicoflyContext = /* @__PURE__ */ createContext()
export let Picofly = PicoflyContext.Provider
export let useContextStore = () => useContext(PicoflyContext)

export let useStore = (store = useContextStore()) => {
	let trackedRef = useRef()
	let updateIdRef = useRef(0)

	trackedRef.current = new WeakMap()

	useRenderRead(store, (obj, prop) => {
		let tracked = trackedRef.current
		let objTrackedProps = tracked.get(obj)

		if (objTrackedProps) {
			objTrackedProps.add(prop)
		} else {
			tracked.set(obj, new Set([prop]))
		}
	})

	let subscribe = useCallback(onChange => onWrite(store, (obj, prop) => {
		if (trackedRef.current.get(obj)?.has(prop)) {
			updateIdRef.current++
			onChange()
		}
	}), [store])

	let getUpdateId = () => (
		updateIdRef.current
	)

	useSyncExternalStore(subscribe, getUpdateId)

	return store
}

// private
let RenderReadUnsubSym = Symbol()

// store will be locked to change immediately after the call
// and unlocked at any (!) component commit stage
// keep in mind that next rendered component
// will override previous onRead callback
let useRenderRead = (store, cb) => {
	lock(store)

	let $ = get$(store)

	$[RenderReadUnsubSym]?.()
	$[RenderReadUnsubSym] = onRead(store, cb)

	let cleanup = () => {
		if (!$[RenderReadUnsubSym]) return

		$[RenderReadUnsubSym]()
		$[RenderReadUnsubSym] = null
		unlock(store)
	}

	useInsertionEffect(cleanup)

	// due to the asynchronous nature of rendering
	// useInsertionEffect may not always be called after each render
	// (for ex. when the data was updated between the render and commit stages)
	// we will schedule cleanup so as not to miss such a situation
	queueMicrotask(cleanup)
}
