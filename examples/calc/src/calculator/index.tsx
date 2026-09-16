import {useRef} from 'react'
import {create} from 'picofly'
import {Picofly} from 'picofly/react'
import {Calc} from './store.ts'
import {CellX} from './cell-x.tsx'
import {Sum} from './sum.tsx'
import {Inc} from './inc.tsx'
import {Reset} from './reset.tsx'

// create and put the store in context
// can be global for the app or local, as here

export let Calculator = () => {
	let calc = useRef<Calc>(null).current
		??= create(new Calc())

	// not happy with context? see https://picofly.dev/tips#without-context
	return (
		<Picofly value={calc}>
			<div className="cells">
				<CellX title="app.a" cell="a"/>
				<CellX title="app.b" cell="b"/>
				<Sum/>
			</div>

			<div className="buttons">
				<Inc cell="a"/>
				<Inc cell="b"/>
				<Reset/>
			</div>
		</Picofly>
	)
}
