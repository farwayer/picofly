import {useEffect} from 'react'
import {select} from 'picofly/react'
import {Button} from '~/views/button.tsx'
import type {Calc, Key} from './store.ts'

// selectors can do more than read the store
// they can attach callbacks and use hooks

let props = (calc: Calc, props: {cell: Key}) => ({
	title: `${props.cell}++`,
	onClick: () => calc.inc(props.cell),
})

let logRendered = () => {
	useEffect(() => console.log('inc rendered!'))
}

export let Inc = select(props, logRendered)(Button)
