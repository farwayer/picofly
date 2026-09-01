import {proxifyObj} from './obj.js'
import {proxifyMap} from './map.js'
import {proxifySet} from './set.js'
import {RefSym} from './ref.js'

export let obj = ($, val) =>
	typeof val === 'object' && val
		? $[1].get(val) || proxifyObj($, val)
		: val

export let objIgnoreSpecials = ($, val) =>
	typeof val !== 'object' || !val
		? val
		: $[1].get(val) || (
			Symbol.toStringTag in val ||
			val instanceof Date ||
			val instanceof Error ||
			val instanceof RegExp ||
			val instanceof Number ||
			val instanceof String ||
			val instanceof Boolean
				? val
				: proxifyObj($, val)
		)

export let map = ($, val) =>
	val instanceof Map
		? $[1].get(val) || proxifyMap($, val)
		: val

export let objMap = ($, val) =>
	typeof val !== 'object' || !val
		? val
		: $[1].get(val) || (
			val instanceof Map
				? proxifyMap($, val)
				: proxifyObj($, val)
		)

export let objMapIgnoreSpecials = ($, val) =>
	typeof val !== 'object' || !val
		? val
		: $[1].get(val) || (
			val instanceof Map
				? proxifyMap($, val)
				: (
					Symbol.toStringTag in val ||
					val instanceof Date ||
					val instanceof Error ||
					val instanceof RegExp ||
					val instanceof Number ||
					val instanceof String ||
					val instanceof Boolean
						? val
						: proxifyObj($, val)
				)
		)

export let objMapIgnoreSpecialsRef = ($, val) =>
	typeof val !== 'object' || !val
		? val
		: $[1].get(val) || (
			$[RefSym]?.has(val)
				? val
				: val instanceof Map
					? proxifyMap($, val)
					: (
						Symbol.toStringTag in val ||
						val instanceof Date ||
						val instanceof Error ||
						val instanceof RegExp ||
						val instanceof Number ||
						val instanceof String ||
						val instanceof Boolean
							? val
							: proxifyObj($, val)
					)
		)

export let objMapSetIgnoreSpecialsRef = ($, val) =>
	typeof val !== 'object' || !val
		? val
		: $[1].get(val) || (
			$[RefSym]?.has(val)
				? val
				: val instanceof Map
					? proxifyMap($, val)
					: val instanceof Set
						? proxifySet($, val)
						: (
							Symbol.toStringTag in val ||
							val instanceof Date ||
							val instanceof Error ||
							val instanceof RegExp ||
							val instanceof Number ||
							val instanceof String ||
							val instanceof Boolean
								? val
								: proxifyObj($, val)
						)
		)
