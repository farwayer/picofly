import {proxifyObj} from './obj.js'
import {proxifyMap} from './map.js'
import {RefSym} from './ref.js'


export let obj = ($, val) =>
  typeof val === 'object' && val
    ? proxifyObj($, val)
    : val

export let objIgnoreSpecials = ($, val) =>
  typeof val !== 'object' ||
  !val ||
  val instanceof Date ||
  val instanceof Error ||
  val instanceof RegExp ||
  val instanceof Map ||
  val instanceof Set ||
  val instanceof WeakMap ||
  val instanceof WeakSet ||
  val instanceof ArrayBuffer ||
  val instanceof Number ||
  val instanceof String ||
  val instanceof Promise ||
  val instanceof File ||
  isTypedArray(val) ||
  (typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
  (typeof Node !== 'undefined' && val instanceof Node)
    ? val
    : proxifyObj($, val)

export let map = ($, val) =>
  val instanceof Map
    ? proxifyMap($, val)
    : val

export let objMap = ($, val) => {
  if (typeof val !== 'object' || !val) {
    return val
  }

  return val instanceof Map
    ? proxifyMap($, val)
    : proxifyObj($, val)
}

export let objMapIgnoreSpecials = ($, val) => {
  if (
    typeof val !== 'object' ||
    !val ||
    val instanceof Date ||
    val instanceof Error ||
    val instanceof RegExp ||
    val instanceof Set ||
    val instanceof WeakMap ||
    val instanceof WeakSet ||
    val instanceof ArrayBuffer ||
    val instanceof Number ||
    val instanceof String ||
    val instanceof Promise ||
    val instanceof File ||
    isTypedArray(val) ||
    (typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
    (typeof Node !== 'undefined' && val instanceof Node)
  ) {
    return val
  }

  return val instanceof Map
    ? proxifyMap($, val)
    : proxifyObj($, val)
}

export let objMapIgnoreSpecialsRef = ($, val) => {
  if (
    typeof val !== 'object' ||
    !val ||
    val instanceof Date ||
    val instanceof Error ||
    val instanceof RegExp ||
    val instanceof Set ||
    val instanceof WeakMap ||
    val instanceof WeakSet ||
    val instanceof ArrayBuffer ||
    val instanceof Number ||
    val instanceof String ||
    val instanceof Promise ||
    val instanceof File ||
    isTypedArray(val) ||
    (typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
    (typeof Node !== 'undefined' && val instanceof Node)
  ) {
    return val
  }

  let refs = $[RefSym]
  if (refs && refs.has(val)) {
    return val
  }

  return val instanceof Map
    ? proxifyMap($, val)
    : proxifyObj($, val)
}

let isTypedArray = ArrayBuffer.isView
