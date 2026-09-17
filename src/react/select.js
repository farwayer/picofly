import {memo, createElement} from 'react'
import {useStore} from './use-store.js'

export let select = (...selectors) => (Component, options) => {
	let store = options?.store

	let Select = memo(props => {
		let cstore = typeof store === 'function' ? store() : store
		cstore = useStore(cstore)

		props = selectors.reduce((props, selector) => (
			Object.assign({}, props, selector(cstore, props))
		), props)

		return createElement(Component, props)
	})

	Select.displayName = `select(${
		Component.displayName ||
		Component.render?.name ||
		Component.name ||
		'Unknown'
	})`

	return Select
}
