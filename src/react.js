import {
  createContext, useCallback, useContext, useEffect, useRef,
  useSyncExternalStore, useLayoutEffect,
} from 'react'
import {onWrite, readable, protect, unprotect} from './store.js'


export let StoreContext = /* @__PURE__ */ createContext()
export let StoreProvider = StoreContext.Provider

export let useStore = (store) => {
  let [getSnapshot, updateSnapshot] = useInc()

  let observedRef = useRef()
  observedRef.current = new WeakMap()

  let readableStore = useProtectedReadable((wProxy, prop) => {
    let observed = observedRef.current
    let props = observed.get(wProxy)

    if (props) {
      props.add(prop)
    } else {
      observed.set(wProxy, new Set([prop]))
    }
  }, store)

  let subscribe = useCallback(onChange =>
    onWrite(readableStore, (wProxy, prop) => {
      let observed = observedRef.current
      let props = observed.get(wProxy)
      if (!props?.has(prop)) return

      updateSnapshot()
      onChange()
    }
  ), [readableStore])

  useSyncExternalStore(subscribe, getSnapshot)

  return readableStore
}

let useInc = () => {
  let ref = useRef(0)
  return [() => ref.current, () => ref.current++]
}

let useCached = (get, deps) => {
  let ref = useRef()

  if (!ref.current) {
    ref.current = [get()]
  }

  useEffect(() => () => {
    ref.current[0] = get()
  }, deps)

  return ref.current[0]
}

// exported for external libs
export let useContextStore = () =>
  useContext(StoreContext)

export let useReadable = (onRead, store = useContextStore()) =>
  useCached(() => readable(store, onRead), [store])

export let useProtectedReadable = (onRead, store) => {
  let readableStore = protect(useReadable(onRead, store))

  useLayoutEffect(() => {
    unprotect(readableStore)
  })

  return readableStore
}
