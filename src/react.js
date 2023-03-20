import {
  createContext, useContext, useMemo, useCallback, useRef, useLayoutEffect,
  useSyncExternalStore,
} from 'react'
import {onWrite, readable, protect, unprotect} from './store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider

export let useStore = (store = useContextStore()) => {
  let getTracked = useReinit(() => new WeakMap())
  let [getUpdateId, incUpdateId] = useInc()

  store = useProtectedReadable((wProxy, prop) => {
    let tracked = getTracked()
    let objTrackedProps = tracked.get(wProxy)

    if (objTrackedProps) {
      objTrackedProps.add(prop)
    } else {
      tracked.set(wProxy, new Set([prop]))
    }
  }, store)

  let subscribe = useCallback(onChange => onWrite(store, (wProxy, prop) => {
    let objTrackedProps = getTracked().get(wProxy)
    if (!objTrackedProps?.has(prop)) return

    incUpdateId()
    onChange()
  }), [store])

  useSyncExternalStore(subscribe, getUpdateId)

  return store
}

let useInc = () => {
  let ref = useRef(0)
  return [() => ref.current, () => ref.current++]
}

// exported for external libs
export let useContextStore = () =>
  useContext(StoreContext)

export let useReadable = (onRead, store) =>
  useMemo(() => readable(store, onRead), [store])

export let useProtectedReadable = (onRead, store) => {
  let readableStore = protect(useReadable(onRead, store))

  useLayoutEffect(() => {
    unprotect(readableStore)
  })

  return readableStore
}

let useReinit = (get) => {
  let ref = useRef()
  ref.current = get()
  return () => ref.current
}
