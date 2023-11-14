import {get$} from '../store.js'


export let RefSym = Symbol()

export let ref = (store, val) => {
  if (typeof val !== 'object' || val === null) {
    return val
  }

  let $ = get$(store)

  let refs = $[RefSym]
  if (!refs) {
    refs = $[RefSym] = new WeakSet()
  }

  refs.add(val)

  return val
}

export let isRef = (store, val) => {
  if (typeof val !== 'object' || val === null) {
    return false
  }

  let $ = get$(store)
  let refs = $[RefSym]
  if (!refs) return false

  return refs.has(val)
}
