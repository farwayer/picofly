import {Bench} from 'tinybench'
import c from 'picocolors'
import picoflyPkg from 'picofly/package.json' with {type: 'json'}
import valtioPkg from 'valtio/package.json' with {type: 'json'}
import mobxPkg from 'mobx/package.json' with {type: 'json'}


let Notes = {
  create: 'Picofly only creates a proxy on the first read, unlike MobX and Valtio',
  firstRead: 'Picofly creates a proxy on the first read, so the first access will be a bit slower than subsequent',
  valtioNoGet: "Valtio doesn't attach `get` Proxy hook to the underlying proxy but does it later in the React adapter",
  valtioMap: "Valtio has no real Map support, only very slow polyfill",
  mobxMap: "MobX uses polyfill too, but fast enough and with real Map's for data storage",
}

export let bench = (name, notes = []) => {
  if (!Array.isArray(notes)) {
    notes = [notes]
  }

  let bench = new Bench()

  let run = async () => {
    let tasks = await bench.run()
    printResult(name, tasks, notes.map(id => Notes[id]))
  }

  let runner = {run}

  runner.picofly = (fn, opts) =>
    bench.add(`Picofly ${picoflyPkg.version}`, fn, opts) && runner

  runner.valtio = (fn, opts) =>
    bench.add(`Valtio ${valtioPkg.version}`, fn, opts) && runner

  runner.mobx = (fn, opts) =>
    bench.add(`MobX ${mobxPkg.version}`, fn, opts) && runner

  return runner
}

let printResult = (name, tasks, notes) => {
  let fastest = getFastest(tasks)

  console.log(`\n${c.magenta(c.bold(name))}`)
  console.table(tasks.map(task => ({
    'Name': task.name,
    'ops/s': Math.floor(ops(task)),
    'Margin': `\xb1${task.result.throughput.rme.toFixed(2)}%`,
    'Compare': (
      task === fastest ||
      (ops(fastest) - ops(task)) / ops(task) <= 0.1
    )
      ? '✔ Fastest'
      : '🔻' + (ops(fastest) / ops(task)).toFixed(2) + 'x',
  })))

  notes = notes.map(e => `* ${e}`).join('\n')
  notes.length && console.log(c.yellow(notes))
}

let ops = task => task.result.throughput.mean

let getFastest = tasks => tasks.reduce((res, task) => (
  ops(res) > ops(task) ? res : task
))
