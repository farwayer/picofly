import {
  createContext, useContext, useCallback, useRef, useLayoutEffect,
  useSyncExternalStore, useTransition,
} from 'react'
import {onWrite, onRead, lock, unlock} from '../store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider
export let useContextStore = () => useContext(StoreContext)

// store will be locked to change immediately after the call
// and unlocked at any (!) component commit stage
export let useStore = (store = useContextStore()) => {
  lock(store)

  let trackedRef = useRef()
  let updateIdRef = useRef(0)

  trackedRef.current = new WeakMap()

  let unsubRead = onRead(store, (obj, prop) => {
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

  queueMicrotask(() => {
    unsubRead()
    unlock(store)
  })

  return store
}

export let usePostRenderCallback = (fn, deps) => {
  let inRenderRef = useRef()
  let argsRef = useRef()
  let startTransition = useTransition()[1]

  inRenderRef.current = 1

  useLayoutEffect(() => {
    inRenderRef.current = 0

    let args = argsRef.current
    if (!args) return

    fn(...args)
    argsRef.current = 0
  })

  return useCallback((...args) => {
    let inRender = inRenderRef.current

    if (inRender) {
      startTransition(() => {
        argsRef.current = args
      })
    } else {
      fn(...args)
    }
  }, deps)
}
