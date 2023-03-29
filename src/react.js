import {
  createContext, useContext, useCallback, useRef, useLayoutEffect,
  useSyncExternalStore, useTransition,
} from 'react'
import {onWrite, onRead, lock, unlock, get$} from './store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider

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
    let objTrackedProps = trackedRef.current.get(obj)
    if (!objTrackedProps) return
    if (!objTrackedProps.has(prop)) return

    updateIdRef.current++
    onChange()
  }), [store])

  let getUpdateId = () => (
    updateIdRef.current
  )

  useSyncExternalStore(subscribe, getUpdateId)

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


// for external libs
export let useContextStore = () =>
  useContext(StoreContext)

export let RenderReadUnsubSym = Symbol()

// store will be write-protected immediately after the call
// and unprotected at any (!) component commit stage
// keep in mind that next rendered component
// overrides onRead callback
export let useRenderRead = (store, cb) => {
  lock(store)

  let $ = get$(store)

  let prevUnsub = $[RenderReadUnsubSym]
  prevUnsub && prevUnsub()

  let unsub = onRead(store, cb)
  $[RenderReadUnsubSym] = unsub

  useLayoutEffect(() => {
    unsub()
    $[RenderReadUnsubSym] = 0
    unlock(store)
  })
}
