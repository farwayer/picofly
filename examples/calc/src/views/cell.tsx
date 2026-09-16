import {useRef} from 'react'

type Props = {
	title: string
	value: number
}

export let Cell = ({title, value}: Props) => {
	let renders = useRef(0)
	renders.current++

	return (
		<div className="cell">
			<code>{title}</code>
			<span className="value" key={renders.current}>{value}</span>
			<span className="renders">renders: {renders.current}</span>
		</div>
	)
}
