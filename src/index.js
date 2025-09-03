import {store} from './store.js'
import {objMapSetIgnoreSpecialsRef} from './proxify/index.js'

export * from './store.js'
export * from './proxify/index.js'
export * from './proxify/ref.js'

export let create = (initValue, proxify = objMapSetIgnoreSpecialsRef) =>
	store(initValue, proxify)
