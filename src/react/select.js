import {memo, createElement} from 'react'
import {useStore} from './use-store.js'

export let select = (...selectors) => (Component, options = {}) => {
	let {getStore} = options

	let Select = memo(props => {
		let store = useStore(getStore?.())

		props = selectors.reduce((props, selector) => (
			Object.assign(props, selector(store, props))
		), {...props})

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
