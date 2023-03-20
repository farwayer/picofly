import {
  createContext, useContext, useMemo, useCallback, useRef, useLayoutEffect,
  useSyncExternalStore, useTransition,
} from 'react'
import {onWrite, readable, protect, unprotect} from './store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider

export let useStore = (store = useContextStore()) => {
  let getTracked = useNewWeakMap()
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

export let usePostRenderCallback = (fn, deps) => {
  let inRenderRef = useRef()
  let argsRef = useRef()
  let [,startTransition] = useTransition()

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


let useInc = () => {
  let ref = useRef(0)
  return [() => ref.current, () => ref.current++]
}

let useNewWeakMap = () => {
  let ref = useRef()
  ref.current = new WeakMap()
  return () => ref.current
}
