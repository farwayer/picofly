import {useCallback, useEffect} from 'react'

export let callback = (name, cb, deps) =>
	(app, props) => ({
		[name]: useCallback(
			(...args) => {
				cb(app, ...args)
			},
			[app, ...deps?.(app, props) ?? []],
		),
	})

export let effect = (fns = {}) => {
	let {run, clean, deps} = fns

	return (app, props) => useEffect(
		() => {
			let runClean = run?.(app, props)

			if (typeof runClean === 'function') {
				return () => runClean(app, props)
			}

			return clean && (() => clean(app, props))
		},
		deps?.(app, props),
	)
}
