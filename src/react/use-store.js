import {
	createContext, useContext, useRef, useInsertionEffect, useCallback,
	useSyncExternalStore,
} from 'react'
import {onWrite, onRead, lock, unlock, get$} from '../store.js'

export let ReactSym = /* @__PURE__ */ Symbol()

export let PicoflyContext
export let Picofly = /* @__PURE__ */ (() => (
	PicoflyContext ??= createContext()
).Provider)()
export let useContextStore = () => useContext(PicoflyContext)

// store will be locked after the call and before any component commit stage
export let useStore = (store = useContextStore() || "use <Picofly>!"()) => {
	let state = useRef().current ??= {
		epoch: 1,
		subs: [],
		notify: null,
	}

	let trackRead = attachTracker(store)
	let stopTrackRead = trackRead(state)

	let subscribe = useCallback(onChange => {
		state.notify = onChange

		return () => {
			state.epoch++
			cutSubsTailIfNeed(state, 0)
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

	// 67 bc
	onWrite(store, (obj, key) => {
		let sub = allSubs.get(obj)?.get(key)

		while (sub) {
			let state = sub.state

			// dirty flag
			if (state.epoch & 1) {
				state.epoch++
				state.notify?.()
			}

			sub = sub.next
		}
	})

	let upLastObjSubs = (obj) => {
		if (obj !== lastObj) {
			lastObj = obj
			lastObjSubs = allSubs.get(obj)
		}

		if (!lastObjSubs) {
			allSubs.set(obj, lastObjSubs = new Map())
		}
	}

	let retrack = (key) => {
		cutSubsTailIfNeed(state, subIndex)
		addSub(state, lastObjSubs, key)
	}

	// 74 bc
	let trackKey = (obj, key) => {
		upLastObjSubs(obj)

		let subs = state.subs
		let sub = subs[subIndex]

		if (!sub || sub.objSubs !== lastObjSubs || sub.key !== key) {
			// reader subscription list changed
			retrack(key)
		}

		subIndex++
	}

	// can be called twice: useInsertionEffect + queueMicrotask
	let stopTrackRead = () => {
		if (state) {
			cutSubsTailIfNeed(state, subIndex)
			readUnsub()
			state = null
			lastObj = null
			lastObjSubs = null
			unlock(store)
		}
	}

	return $[ReactSym] = (readerState) => {
		lock(store)

		if (state) {
			// cut previous reader subs tail
			cutSubsTailIfNeed(state, subIndex)
		} else {
			// we are the first in the render queue
			readUnsub = onRead(store, trackKey)
		}

		state = readerState
		readerState.epoch |= 1
		subIndex = 0

		return stopTrackRead
	}
}

let cutSubsTailIfNeed = (state, from) => {
	let subs = state.subs
	let len = subs.length

	if (len > from) {
		cutSubsTail(subs, from, len)
	}
}

let cutSubsTail = (subs, from, len) => {
	while (--len >= from) {
		let sub = subs[len]
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
		}	else {
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
