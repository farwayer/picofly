// Reads a tsv written by run.sh and prints the median over passes, the best
// pass, and how wide the spread is — rme, the 95% margin around the median.
// Usage: node perf/report.js [perf/results/<stamp>.tsv]
import {readdirSync, readFileSync} from 'node:fs'

let file = process.argv[2] || newest()
let text = readFileSync(file, 'utf8')

let head = []
let runs = new Map() // bench -> label -> [ns]
let labels = []

for (let line of text.split('\n')) {
  if (line.startsWith('#')) {
    head.push(line.slice(2))
    continue
  }

  let [pass, bench, label, ns] = line.split('\t')
  if (!bench) continue

  if (!labels.includes(label)) labels.push(label)

  let byLabel = runs.get(bench) || runs.set(bench, new Map()).get(bench)
  byLabel.set(label, [...(byLabel.get(label) || []), [+pass, +ns]])
}

let short = labels.map(l => l
  .replace(/^Picofly \S+ ?/, 'picofly ')
  .replace(/^Valtio \S+/, 'valtio')
  .replace(/^MobX \S+/, 'mobx')
  .trim()
)

let width = Math.max(...[...runs.keys()].map(b => b.length))
let cell = Math.max(11, ...short.map(s => s.length + 1))

console.log(head.map(h => h.replace('\t', ': ')).join('\n'))
console.log(`\nns/op, median of ${[...runs.values()][0].values().next().value.length} passes\n`)
console.log('bench'.padEnd(width), short.map(s => s.padStart(cell)).join(''), '   rme')

let allRme = []
let allDrift = []

for (let [bench, byLabel] of runs) {
  let stats = labels.map(l => summary(byLabel.get(l) || []))
  let best = Math.min(...stats.map(s => s.median))

  let cells = stats.map(({median}) => {
    let s = median < 100 ? median.toFixed(1) : Math.round(median).toLocaleString('en-US')
    return (median === best ? '*' + s : s).padStart(cell)
  })

  // the widest rme of the three says how much this bench can be trusted
  let rme = Math.max(...stats.map(s => s.rme))
  allRme.push(rme)
  allDrift.push(...stats.map(s => s.drift))

  console.log(bench.padEnd(width), cells.join(''), (rme.toFixed(1) + '%').padStart(7))
}

let at = (all, p) => {
  all.sort((a, b) => a - b)
  return all[Math.min(all.length - 1, Math.floor(all.length * p))]
}

console.log(
  `\nrme:   median ${at(allRme, 0.5).toFixed(1)}%,` +
  ` 90th ${at(allRme, 0.9).toFixed(1)}%` +
  ` — a difference below the rme of both sides is not a difference`
)
console.log(
  `drift: median ${at(allDrift, 0.5).toFixed(1)}%,` +
  ` 90th ${at(allDrift, 0.9).toFixed(1)}% per pass` +
  ` — the machine heating up over the run, kill turbo to flatten it`
)

// private
function summary(points) {
  if (!points.length) return {median: Infinity, rme: 0, drift: 0}

  let ns = points.map(([, v]) => v)
  let sorted = [...ns].sort((a, b) => a - b)
  let median = sorted[sorted.length >> 1]
  let mean = ns.reduce((sum, x) => sum + x, 0) / ns.length

  if (ns.length < 2) return {median, rme: 0, drift: 0}

  let variance = ns.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (ns.length - 1)
  let moe = 1.96 * Math.sqrt(variance) / Math.sqrt(ns.length)

  // how much the numbers climb from pass to pass, least squares over the run
  let passes = points.map(([p]) => p)
  let mp = passes.reduce((sum, x) => sum + x, 0) / passes.length
  let cov = points.reduce((sum, [p, v]) => sum + (p - mp) * (v - mean), 0)
  let varp = passes.reduce((sum, p) => sum + (p - mp) ** 2, 0)
  let drift = varp ? cov / varp / mean * 100 : 0

  return {median, rme: moe / mean * 100, drift}
}

function newest() {
  let dir = 'perf/results'
  let files = readdirSync(dir).filter(f => f.endsWith('.tsv')).sort()
  if (!files.length) 'no results yet, run perf/run.sh first!'()
  return `${dir}/${files.at(-1)}`
}
