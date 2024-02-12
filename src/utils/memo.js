import {onRead, onWrite} from '../store.js'


export let memo = (store, calc) => {
  let cached = false
  let cachedResult
  let deps = new WeakMap()

  onWrite(store, (obj, prop) => {
    let props = deps.get(obj)
    if (!props) return
    if (!props.has(prop)) return

    cached = false
  })

  onRead(store, (obj, prop) => {
    let props = deps.get(obj)

    if (props) {
      props.add(prop)
    } else {
      deps.set(obj, new Set([prop]))
    }
  })

  return () => {
    if (cached) {
      return cachedResult
    }

    deps = new WeakMap()
    cachedResult = calc()
    cached = true

    return cachedResult
  }
}
