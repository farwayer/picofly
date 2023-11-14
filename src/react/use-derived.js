import {useCallback, useRef, useSyncExternalStore} from 'react'
import {onRead, onWrite} from '../store.js'


let NotCached = {}

export let useDerived = (store, calc, ctx) => {
  let cachedRef = useRef(NotCached)
  let trackedRef = useRef()
  let ctxRef = useRef()

  let subscribe = useCallback(onChange => onWrite(store, (obj, prop) => {
    let objTrackedProps = trackedRef.current.get(obj)
    if (!objTrackedProps) return
    if (!objTrackedProps.has(prop)) return

    cachedRef.current = NotCached
    onChange()
  }), [store])

  let getSnapshot = () => {
    let {current} = cachedRef
    if (current !== NotCached && ctxEqual(ctxRef.current, ctx)) {
      return current
    }

    trackedRef.current = new WeakMap()
    ctxRef.current = ctx

    let unsub = onRead(store, (obj, prop) => {
      let tracked = trackedRef.current
      let objTrackedProps = tracked.get(obj)

      if (objTrackedProps) {
        objTrackedProps.add(prop)
      } else {
        tracked.set(obj, new Set([prop]))
      }
    })

    current = cachedRef.current = calc(store, ctx)
    unsub()

    return current
  }

  return useSyncExternalStore(subscribe, getSnapshot)
}

let ctxEqual = (c1, c2) => (
  c1 === c2 ||
  Object.entries(c1).every(([k, v]) => v === c2[k])
)
