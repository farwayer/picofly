export let spec = spec => {
	let getters = Object.entries(spec).map(([name, selector]) => {
		if (typeof selector === 'string') {
			selector = pathGetter(selector)
		}

		return [name, selector]
	})

	return (app, props) => {
		let values = {}

		for (let [name, get] of getters) {
			values[name] = get(app, props)
		}

		return values
	}
}

export let item = (name, cfg = {}) => {
	let {map: mapPath = `${name}s`, idProp = 'id'} = cfg
	let getMap = pathGetter(mapPath)
	let getId = pathGetter(idProp)

	return (app, props) => {
		let map = getMap(app) || 'map not found!'()
		let id = getId(props)
		let value = map.get(id)

		return {[name]: value}
	}
}


// private
let pathGetter = path => {
	let keys = path.split('.')

	return from => {
		let value = from

		for (let key of keys) {
			if (value == null) break
			value = value[key]
		}

		return value
	}
}
