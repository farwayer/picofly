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

// an app op is hundreds of microseconds, so that group reads in µs
let scale = bench => bench.startsWith('app/') ? 1000 : 1
let scaled = [...runs.keys()].filter(b => scale(b) > 1).length
let per = !scaled ? 'ns/op' : scaled === runs.size ? 'µs/op' : 'ns/op, app in µs/op'

console.log(head.map(h => h.replace('\t', ': ')).join('\n'))
console.log(`\n${per}, median of ${[...runs.values()][0].values().next().value.length} passes\n`)
console.log('bench'.padEnd(width), short.map(s => s.padStart(cell)).join(''), '   rme')

let allRme = []
let allDrift = []

for (let [bench, byLabel] of runs) {
  let stats = labels.map(l => summary(byLabel.get(l) || [], scale(bench)))
  let best = Math.min(...stats.map(s => s.median))

  // a lib can be missing from a bench: the app group has a fourth column
  let cells = stats.map(({median}) => {
    if (!isFinite(median)) return '—'.padStart(cell)

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

// the headline multiplier, recomputed inside every pass, so its own spread
// over the run says how much the number can be trusted
let groups = []
for (let bench of runs.keys()) {
  let group = bench.split('/')[0]
  if (!groups.includes(group)) groups.push(group)
}

let passes = [...new Set([...runs.values()]
  .flatMap(byLabel => [...byLabel.values()].flat().map(([pass]) => pass)))]

if (labels.length > 1 && passes.length > 1) {
  console.log(`\nx vs ${short.slice(1).join(' and ')},` +
    ` median over the group, spread over ${passes.length} passes`)

  for (let group of groups) {
    let benches = [...runs.keys()].filter(b => b.split('/')[0] === group)

    let cells = labels.slice(1).map(rival => {
      let byPass = passes.map(pass => {
        let ratios = benches.map(bench => {
          let byLabel = runs.get(bench)
          let mine = byLabel.get(labels[0])?.find(([p]) => p === pass)
          let theirs = byLabel.get(rival)?.find(([p]) => p === pass)

          return mine && theirs ? theirs[1] / mine[1] : null
        })

        return at(ratios.filter(r => r), 0.5)
      }).filter(r => r)

      if (!byPass.length) return '—'.padStart(9) + ''.padStart(15)

      let x = n => n < 10 ? n.toFixed(1) : Math.round(n).toLocaleString('en-US')

      return (x(at([...byPass], 0.5)) + 'x').padStart(9) +
        `${x(Math.min(...byPass))}–${x(Math.max(...byPass))}`.padStart(15)
    })

    console.log(group.padEnd(8), cells.join(''))
  }
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
function summary(points, scale = 1) {
  if (!points.length) return {median: Infinity, rme: 0, drift: 0}

  let ns = points.map(([, v]) => v / scale)
  let sorted = [...ns].sort((a, b) => a - b)
  let median = sorted[sorted.length >> 1]
  let mean = ns.reduce((sum, x) => sum + x, 0) / ns.length

  if (ns.length < 2) return {median, rme: 0, drift: 0}

  let variance = ns.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (ns.length - 1)
  let moe = 1.96 * Math.sqrt(variance) / Math.sqrt(ns.length)

  // how much the numbers climb from pass to pass, least squares over the run
  let passes = points.map(([p]) => p)
  let mp = passes.reduce((sum, x) => sum + x, 0) / passes.length
  let cov = points.reduce((sum, [p], i) => sum + (p - mp) * (ns[i] - mean), 0)
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
