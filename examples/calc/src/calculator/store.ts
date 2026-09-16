export type Key = 'a' | 'b'

// describe the app state, a class or a plain object
export class Calc {
  a = 0
  b = 0
  resetting = false

	// getters, setters and methods keep working
	inc(key: Key) {
		this[key]++
	}
}

// write plain functions that read and change data
// they can be async, generators, whatever

export let reset = async (calc: Calc) => {
	calc.resetting = true

	await wait(500)

	calc.a = 0
	calc.b = 0
	calc.resetting = false
}


let wait = (ms: number) =>
	new Promise(done => setTimeout(done, ms))
