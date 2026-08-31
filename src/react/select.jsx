import React, {memo} from 'react'
import {useStore} from './use-store.js'

export let select = (...selectors) => (Component, options = {}) => {
	let {getStore} = options
	let name = (
		Component.displayName ||
		Component.render?.name ||
		Component.name ||
		'Unknown'
	)

	let Selector = memo(props => {
		let store = useStore(getStore?.())

		props = selectors.reduce((props, selector) => (
			Object.assign({}, props, selector(store, props))
		), props)

		return <Component {...props}/>
	})
	Selector.displayName = `select(${name})`

	return Selector
}
