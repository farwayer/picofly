import {snapshot, subscribe} from 'valtio'
import {createProxy} from 'proxy-compare'
import {observe, Reaction} from 'mobx'
import {onRead, onWrite} from 'picofly'
import picoflyPkg from 'picofly/package.json' with {type: 'json'}
import valtioPkg from 'valtio/package.json' with {type: 'json'}
import mobxPkg from 'mobx/package.json' with {type: 'json'}
import zustandPkg from 'zustand/package.json' with {type: 'json'}

// runs in node and in bare shells (jsc, js), so nothing from node: here.
// arguments come after -- as `pass lib bench`, node also accepts env vars
let shellArgs = globalThis.__perfArgs
  || (typeof scriptArgs !== 'undefined' ? scriptArgs : null)
let args = shellArgs?.length ? shellArgs
  : typeof process !== 'undefined' ? process.argv.slice(2)
  : []
let argv = Array.from(args).filter(a => a !== '--')
let env = typeof process !== 'undefined' && process.env ? process.env : {}

let pass = argv[0] || env.PERF_PASS || '1'
let onlyLib = argv[1] || env.PERF_LIB || ''
let benchId = argv[2] || env.PERF_BENCH || globalThis.__perfBench || guessBench()
let quick = env.PERF_QUICK
// let the event loop run at the end of a region, so work a renderer
// puts off to a timer or a frame lands inside the clock
let drainOn = env.PERF_DRAIN
// a frame, not a timer: preact puts its effects on one, happy-dom answers in
// microseconds, and node clamps setTimeout to a whole millisecond
let drain = () => new Promise(done =>
  typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame(() => done())
    : typeof setImmediate === 'function' ? setImmediate(done) : setTimeout(done, 0))

let say = typeof print === 'function' ? print : console.log

// hrtime in node, performance in jsc and js, Date in hermes — it has neither.
// Date steps by a millisecond, so a region has to be long enough to hide it
let now = typeof process !== 'undefined' && process.hrtime?.bigint
  ? () => Number(process.hrtime.bigint())
  : typeof performance !== 'undefined'
  ? () => performance.now() * 1e6
  : () => Date.now() * 1e6

// the step of the clock, not the api behind it: hermes counts in
// milliseconds, jsc clamps performance.now() to 20 µs, node ticks in
// nanoseconds. Anything worse than ten microseconds cannot measure a
// short region on its own
let tick = (() => {
  let min = Infinity

  for (let r = 0; r < 5; r++) {
    let t0 = now()
    let d = 0
    let i = 0

    while (!(d = now() - t0) && i++ < 1e6);
    if (d && d < min) min = d
  }

  return min
})()

let coarse = tick > 10e3

// the onWrite check useStore() runs on every change, once per subscriber
export let watch = (store, subs = 1) => {
  while (subs--) {
    onWrite(store, noop)
  }

  return store
}

export let sub = (proxy, subs = 1) => {
  // sync mode: the default batching parks a microtask per write, and inside
  // a sync timed loop those pile up and retain every subject until the end
  while (subs--) subscribe(proxy, noop, true)
  return proxy
}

export let obs = (observable, subs = 1) => {
  while (subs--) observe(observable, noop)
  return observable
}

let noop = () => {}

// the read tracker useStore() installs for the render
export let track = store => {
  onRead(store, noop)
  return store
}

// what useSnapshot() hands to a component
export let snap = value =>
  createProxy(snapshot(value), new WeakMap(), new WeakMap(), new WeakMap())

// the derivation observer() wraps a render in
export let derived = body => {
  let r = new Reaction('bench', () => {})
  r.track(body)
  r.dispose()
}

export let loop = name => {
  let shared = {}
  let cases = []
  let runner = {}

  let push = (lib, label, cfg) =>
    cases.push({lib, label, cfg: {...shared, ...cfg}})

  let add = (lib, label) => arg => {
    push(lib, label, typeof arg === 'function' ? {run: arg} : arg)
    return runner
  }

  runner.all = cfg => {
    shared = {...shared, ...cfg}
    return runner
  }

  runner.picofly = add('picofly', `Picofly ${picoflyPkg.version}`)
  runner.valtio = add('valtio', `Valtio ${valtioPkg.version}`)
  runner.mobx = add('mobx', `MobX ${mobxPkg.version}`)
  runner.zustand = add('zustand', `Zustand ${zustandPkg.version}`)
  // the same app without any store, so the table shows what react costs
  runner.basic = add('basic', 'React')

  // one library per process, so measure() stays monomorphic for everyone
  // and nobody pays for running second. run.sh rotates who goes first
  runner.run = async () => {
    let picked = onlyLib ? cases.filter(c => c.lib === onlyLib) : cases

    for (let {label, cfg} of picked) {
      say(`${pass}\t${benchId}\t${label}\t${(await measure(cfg)).toFixed(2)}`)
    }
  }

  return runner
}

// private

// one timed region holds many operations, so the clock costs nothing per op
// and the code runs warm; min over repeats keeps the cleanest run seen,
// the spread between repeats is left to report.js. run with --expose-gc
let measure = async ({make, run, fresh, n, repeats, warm, flush, enter = plain}) => {
  repeats ??= fresh ? 30 : 12
  warm ??= 1000

  // hermes has no clock better than a millisecond and no jit to warm up
  if (coarse) warm = Math.max(1, warm >> 2)

  if (quick) {
    n = Math.min(n ?? 50, 50)
    repeats = 2
    warm = 10
  }

  if (env.PERF_N) n = +env.PERF_N
  // a drained region has to await, so every bench takes the flush path
  flush ||= drainOn

  let best = Infinity

  // heat the whole path before the clock, or the first timed window pays
  // for the tier-up and the numbers drift from process to process
  if (fresh) {
    for (let i = 0; i < warm; i++) await run(make(), i)
  } else {
    let subject = make()
    for (let i = 0; i < warm; i++) await run(subject, i)
  }

  if (drainOn) await drain()

  // fresh benches keep their subject count: growing it grows the working
  // set too, and cold reads start measuring cache misses instead
  n ??= fresh ? 2000 : pick(make, run, enter)
  if (env.PERF_DEBUG) say(`# n=${n} repeats=${repeats} tick=${tick}ns`)

  // a coarse clock cannot see a single region: a fresh bench cannot grow
  // its subject count without growing its working set, and the engine has
  // nothing finer to offer. So the regions are summed until there is
  // enough time to divide, and the answer is their average — a minimum
  // over quantised regions would simply pick the shortest tick, or zero.
  // The step of the answer is tick / (regions × n), so the count has to
  // run high: on hermes 200 regions of 200 ops still quantise to 25 ns
  if (coarse) {
    let total = 0
    let ops = 0

    for (let r = 0; r < 200 && total < 100e6; r++) {
      globalThis.gc?.()

      total += (flush
        ? await timedFlush(make, run, fresh, n)
        : timed(make, run, fresh, n, enter)) * n
      ops += n
    }

    return total / ops
  }

  for (let r = 0; r < repeats; r++) {
    // every repeat starts from a comparable heap (needs --expose-gc)
    globalThis.gc?.()

    let ns = flush
      ? await timedFlush(make, run, fresh, n)
      : timed(make, run, fresh, n, enter)
    if (ns < best) best = ns
  }

  return best
}

let plain = body => body()

// an op that flushes for itself cannot run in a sync region: a library that
// coalesces its notifications does it in a microtask, and only after that
// does react have anything to commit. No enter here
let timedFlush = async (make, run, fresh, n) => {
  let all = fresh && Array.from({length: n}, make)
  let one = fresh ? null : make()

  // warm the shapes before the clock, fresh ones are warmed by measure()
  if (one) await run(one, 0)
  if (drainOn) await drain()

  let t = now()

  for (let i = 0; i < n; i++) await run(fresh ? all[i] : one, i)
  if (drainOn) await drain()

  return (now() - t) / n
}

// one timed region holds many operations, so the clock costs nothing per op
// and the code runs warm
let timed = (make, run, fresh, n, enter) => {
  let all = fresh && Array.from({length: n}, make)
  let one = fresh ? null : make()
  let ns, x

  // warm the shapes before the clock starts
  one && run(one, 0)

  enter(() => {
    let t = now()

    if (fresh) {
      for (let i = 0; i < n; i++) x = run(all[i], i)
    } else {
      for (let i = 0; i < n; i++) x = run(one, i)
    }

    ns = (now() - t) / n
  })

  void x
  return ns
}

// a region should be long enough for the clock and for the tier-up to
// disappear in it. grow n on the real loop until it is, no estimating
let pick = (make, run, enter) => {
  // a millisecond clock over a 100 ms region is off by 1%, well under the
  // spread between passes
  let want = coarse ? 100e6 : 25e6 // ns in a region
  let cap = 5000000
  let n = 5000

  for (let step = 0; step < 4 && n < cap; step++) {
    let took = timed(make, run, false, n, enter) * n
    if (took >= want) break

    n = Math.min(Math.ceil(n * want / took), cap)
  }

  return n
}

// only node knows its own path, shells get the name from run.sh
function guessBench() {
  let file = typeof process !== 'undefined' && process.argv[1]
  if (!file) return 'bench'

  let cut = file.replace(/\\/g, '/').split('/perf/')[1] || file
  return cut.replace(/\.js$/, '')
}
