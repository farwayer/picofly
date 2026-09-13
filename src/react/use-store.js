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
		dirty: 0,
		subs: [],
		notify: null,
	}

	let trackRead = attachTracker(store)
	let stopTrackRead = trackRead(state)

	let subscribe = useCallback(onChange => {
		state.notify = onChange

		return () => {
			state.epoch++
			clearTailSubsIfNeed(state, 0)
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

// one tracker to rule them all
let attachTracker = (store) => {
	let $ = get$(store)
	let trackRead = $[ReactSym]

	if (trackRead) {
		return trackRead
	}

	let state, readUnsub, subIndex, lastObj, lastObjSubs
	let allSubs = new WeakMap()

	let upLastObjSubs = obj => {
		if (obj !== lastObj) {
			lastObj = obj
			lastObjSubs = allSubs.get(obj)
		}

		if (!lastObjSubs) {
			allSubs.set(obj, lastObjSubs = new Map())
		}
	}

	let retrack = (key) => {
		clearTailSubsIfNeed(state, subIndex)
		addSub(state, lastObjSubs, key)
	}

	// 74 bc
	let trackKey = (obj, key) => {
		upLastObjSubs(obj)

		let subs = state.subs
		let sub = subs[subIndex]

		if (!sub || sub.objSubs !== lastObjSubs || sub.key !== key) {
			retrack(key)
		}

		subIndex++
	}

	// 93 bc
	onWrite(store, (obj, key) => {
		let objSubs = allSubs.get(obj)

		if (objSubs?.size) {
			let sub = objSubs.get(key)

			if (sub) {
				do {
					let state = sub.state
					if (state.dirty) continue

					state.epoch++

					let notify = state.notify
					if (notify) {
						state.dirty = 1
						notify()
					}
				} while (sub = sub.next)
			}
		}
	})

	return $[ReactSym] = (currentState) => {
		if (state) {
			clearTailSubsIfNeed(state, subIndex)
		} else {
			readUnsub = onRead(store, trackKey)
		}

		state = currentState
		currentState.dirty = 0
		subIndex = 0

		return () => {
			if (state) {
				readUnsub()
				clearTailSubsIfNeed(state, subIndex)
				state = null
				lastObj = null
				lastObjSubs = null
				unlock(store)
			}
		}
	}
}

let clearTailSubsIfNeed = (state, from) => {
	let subs = state.subs

	if (subs.length > from) {
		clearTailSubs(subs, from)
	}
}

let clearTailSubs = (subs, from) => {
	let i = subs.length

	while (--i >= from) {
		let sub = subs[i]
		let prev = sub.prev
		let next = sub.next

		if (next) {
			next.prev = prev
		}

		if (prev) {
			prev.next = next
			continue
		}

		let objSubs = sub.objSubs
		let key = sub.key

		if (next) {
			objSubs.set(key, next)
		}
		else {
			objSubs.delete(key)
		}
	}

	subs.length = from
}

let addSub = (state, objSubs, key) => {
	let next = objSubs.get(key)
	let sub = {state, objSubs, key, next, prev: null}

	if (next) {
		next.prev = sub
	}

	objSubs.set(key, sub)
	state.subs.push(sub)
}
