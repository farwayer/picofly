// Turns a run into the Bench table the site keeps in site/src/const.ts.
// Rows are ordered obj, arr, map, set inside a group, and cold before cached.
//
// run: node perf/site-table.mjs perf/results/<stamp>.tsv [name]
import {readFileSync} from 'node:fs'

let file = process.argv[2] || 'no tsv given!'()
let name = process.argv[3] || 'BENCH'

let Types = ['obj', 'arr', 'map', 'set']
let Groups = ['fill', 'update', 'read']
let Ops = ['set', 'add', 'push', 'delete', 'clear']

let runs = new Map() // bench -> lib -> [ns]

for (let line of readFileSync(file, 'utf8').split('\n')) {
	if (line[0] === '#' || !line.trim()) continue

	let [, bench, label, ns] = line.split('\t')
	let lib = label.startsWith('Picofly') ? 'picofly'
		: label.startsWith('Valtio') ? 'valtio'
		: 'mobx'

	let byLib = runs.get(bench) || runs.set(bench, new Map()).get(bench)
	byLib.set(lib, [...(byLib.get(lib) || []), +ns])
}

let median = all => [...all].sort((a, b) => a - b)[all.length >> 1]
let cell = ns => ns < 100 ? ns.toFixed(1) : Math.round(ns).toLocaleString('en-US')

// cold comes before cached, everything else keeps its name order
let key = bench => bench
	.replace('-cold', '-1')
	.replace('-cached', '-2')

let rank = bench => {
	let [, type] = bench.split('/')
	return Types.indexOf(type)
}

// writes read better in the order they happen to data, not by name
let op = bench => {
	let name = bench.split('/')[2]
	let i = Ops.indexOf(name.split('-')[0])

	return i < 0 ? Ops.length : i
}

console.log(`let ${name}: Bench = [`)

for (let group of Groups) {
	let benches = [...runs.keys()]
		.filter(b => b.startsWith(group + '/'))
		.sort((a, b) =>
			rank(a) - rank(b) || op(a) - op(b) || key(a).localeCompare(key(b)))

	console.log(`  ['${group}', [`)

	for (let bench of benches) {
		let byLib = runs.get(bench)
		let row = ['picofly', 'valtio', 'mobx']
			.map(lib => `'${cell(median(byLib.get(lib)))}'`)
			.join(', ')

		console.log(`    ['${bench.slice(group.length + 1)}', ${row}],`)
	}

	console.log('  ]],')
}

console.log(']')
