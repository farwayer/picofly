import {
  createContext, useContext, useMemo, useCallback, useRef, useLayoutEffect,
  useSyncExternalStore,
} from 'react'
import {onWrite, readable, protect, unprotect} from './store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider

export let useStore = (store) => {
  let [getUpdateId, incUpdateId] = useInc()
  let observedRef = useRef()

  observedRef.current = new WeakMap()

  store = useProtectedReadable((wProxy, prop) => {
    let observed = observedRef.current
    let props = observed.get(wProxy)

    if (props) {
      props.add(prop)
    } else {
      observed.set(wProxy, new Set([prop]))
    }
  }, store)

  let subscribe = useCallback(onChange => onWrite(store, (wProxy, prop) => {
    let observed = observedRef.current
    let props = observed.get(wProxy)
    if (!props?.has(prop)) return

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

export let useReadable = (onRead, store = useContextStore()) =>
  useMemo(() => readable(store, onRead), [store])

export let useProtectedReadable = (onRead, store) => {
  let readableStore = protect(useReadable(onRead, store))

  useLayoutEffect(() => {
    unprotect(readableStore)
  })

  return readableStore
}
