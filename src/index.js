import {store} from './store.js'
import {raw, map, set, builtins, obj} from './rules/index.js'

export * from './store.js'
export * from './rules/index.js'

export let create = state =>
	store(state, [raw, map, set, builtins, obj])
