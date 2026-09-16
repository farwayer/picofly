import {useStore} from 'picofly/react'
import {type Calc, reset} from './store.ts'
import {Button} from '~/views/button.tsx'

// use the same hook to change the data

export let Reset = () => {
	let calc = useStore<Calc>()

	return (
		<Button
			title="reset"
			busy={calc.resetting}
			onClick={() => reset(calc)}
		/>
	)
}
