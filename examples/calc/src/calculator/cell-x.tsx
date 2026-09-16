import {select} from 'picofly/react'
import type {Calc, Key} from './store.ts'
import {Cell} from '~/views/cell.tsx'

// you can use selectors instead of the hook
// selector reads the store and feeds a component

let value = (calc: Calc, props: {cell: Key}) => ({
	value: calc[props.cell]
})

export let CellX = select(value)(Cell)
