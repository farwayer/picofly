import {useStore} from 'picofly/react'
import {Cell} from '~/views/cell.tsx'
import type {Calc} from './store.ts'

// useStore() to read the data and follow its changes

export let Sum = () => {
	let calc = useStore<Calc>()
	let sum = calc.a + calc.b

	return (
		<Cell title="app.a + app.b" value={sum}/>
	)
}
