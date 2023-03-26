import {proxifyObj} from './obj.js'
import {proxifyMap} from './map.js'


export let obj = ($, val) =>
  typeof val === 'object' && val !== null
    ? proxifyObj($, val)
    : val

export let objIgnoreSpecials = ($, val) =>
  typeof val !== 'object' ||
  val === null ||
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
  (typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
  (typeof Node !== 'undefined' && val instanceof Node)
    ? val
    : proxifyObj($, val)

export let map = ($, val) =>
  val instanceof Map
    ? proxifyMap($, val)
    : val

export let objMap = ($, val) => {
  if (typeof val !== 'object' || val === null) {
    return val
  }

  if (val instanceof Map) {
    return proxifyMap($, val)
  }

  return proxifyObj($, val)
}

export let objMapIgnoreSpecials = ($, val) => {
  if (
    typeof val !== 'object' ||
    val === null ||
    val instanceof Date ||
    val instanceof Error ||
    val instanceof RegExp ||
    val instanceof Set ||
    val instanceof WeakMap ||
    val instanceof WeakSet ||
    val instanceof ArrayBuffer ||
    val instanceof Number ||
    val instanceof String ||
    (typeof WeakRef !== 'undefined' && val instanceof WeakRef) ||
    (typeof Node !== 'undefined' && val instanceof Node)
  ) {
    return val
  }

  if (val instanceof Map) {
    return proxifyMap($, val)
  }

  return proxifyObj($, val)
}
