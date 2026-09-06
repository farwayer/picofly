// 26 bc
export let builtins = next => !next ? 40 : ($, val) =>
	isBuiltIn(val)
	  ? val
	  : next($, val)

// 63 bc
let isBuiltIn = val =>
	Symbol.toStringTag in val ||
	val instanceof Date ||
	val instanceof Error ||
	val instanceof RegExp ||
	val instanceof Number ||
	val instanceof String ||
	val instanceof Boolean
