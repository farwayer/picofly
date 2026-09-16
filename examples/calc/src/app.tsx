import {Calculator} from './calculator/index.tsx'
import './styles.css'

export let App = () => {
	return (
		<main>
			<img className="logo" src="/logo.svg" width="601" height="640" alt="Picofly"/>
			<h1>Just write beautiful code</h1>
			<p>Picofly takes care of the rest</p>
			<Calculator/>
		</main>
	)
}
