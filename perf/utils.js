import {snapshot, subscribe} from 'valtio'
import {createProxy} from 'proxy-compare'
import {observe, Reaction} from 'mobx'
import {onRead, onWrite} from 'picofly'
import picoflyPkg from 'picofly/package.json' with {type: 'json'}
import valtioPkg from 'valtio/package.json' with {type: 'json'}
import mobxPkg from 'mobx/package.json' with {type: 'json'}

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
let benchId = argv[2] || env.PERF_BENCH || guessBench()
let quick = env.PERF_QUICK

let say = typeof print === 'function' ? print : console.log

let now = typeof process !== 'undefined' && process.hrtime?.bigint
  ? () => Number(process.hrtime.bigint())
  : () => performance.now() * 1e6

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

  // one library per process, so measure() stays monomorphic for everyone
  // and nobody pays for running second. run.sh rotates who goes first
  runner.run = () => {
    let picked = onlyLib ? cases.filter(c => c.lib === onlyLib) : cases

    for (let {label, cfg} of picked) {
      say(`${pass}\t${benchId}\t${label}\t${measure(cfg).toFixed(2)}`)
    }
  }

  return runner
}

// private

// one timed region holds many operations, so the clock costs nothing per op
// and the code runs warm; min over repeats keeps the cleanest run seen,
// the spread between repeats is left to report.js. run with --expose-gc
let measure = ({make, run, fresh, n, repeats, warm, enter = plain}) => {
  repeats ??= fresh ? 30 : 12
  warm ??= 1000

  if (quick) {
    n = Math.min(n ?? 50, 50)
    repeats = 2
    warm = 10
  }

  let best = Infinity

  // heat the whole path before the clock, or the first timed window pays
  // for the tier-up and the numbers drift from process to process
  if (fresh) {
    for (let i = 0; i < warm; i++) run(make(), i)
  } else {
    let subject = make()
    for (let i = 0; i < warm; i++) run(subject, i)
  }

  // fresh benches keep their subject count: growing it grows the working
  // set too, and cold reads start measuring cache misses instead
  n ??= fresh ? 2000 : pick(make, run, enter)
  if (env.PERF_DEBUG) say(`# n=${n} repeats=${repeats}`)

  for (let r = 0; r < repeats; r++) {
    // every repeat starts from a comparable heap (needs --expose-gc)
    globalThis.gc?.()

    let ns = timed(make, run, fresh, n, enter)
    if (ns < best) best = ns
  }

  return best
}

let plain = body => body()

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
  let want = 25e6 // ns in a region
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
