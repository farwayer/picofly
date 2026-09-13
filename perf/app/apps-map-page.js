// the same records keyed by id as apps-map, but the screen is one page of
// them and the page number lives in the store. A step forward takes the ids
// with iterator helpers, so the reader walks the pages it skips:
// keys().drop(step * shown).take(shown)
import {create} from 'picofly'
// the react entry pulls select.jsx, which node cannot load
import {useStore} from '../../src/react/use-store.js'
import {proxy, useSnapshot} from 'valtio'
import {proxyMap} from 'valtio/utils'
import {observable, runInAction} from 'mobx'
import {observer} from 'mobx-react-lite'
import {memo, useState} from 'react'
import {h, data, counter, rows} from './utils.js'

let entries = n => data(n).items.map(item => [item.id, item])

// the ids of page `step`
let page = (keys, shown, step) => {
  let ids = []

  for (let id of keys.drop(step * shown).take(shown)) {
    ids.push(id)
  }

  return ids
}

// pages wrap around, or a bench longer than the map runs off the end
let stepper = (n, shown) => {
  let pages = Math.ceil(n / shown)

  return step => (step + 1) % pages
}

export let picofly = (n = rows, shown = 100) => {
  let store = create({items: new Map(entries(n)), step: 0})
  let count = counter()
  let next = stepper(n, shown)

  let Row = memo(({id}) => {
    count.hit()

    let app = useStore(store)
    let item = app.items.get(id)

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let app = useStore(store)
    let ids = page(app.items.keys(), shown, app.step)

    return h('ul', null, ids.map(id => h(Row, {key: id, id})))
  }

  return {
    store,
    count,
    element: h(App),
    step: () => store.step = next(store.step),
  }
}

// sync mode by default: inside a sync region valtio has no other way to
// commit. A bench whose op flushes itself passes false and lets valtio
// coalesce its notifications the way it does in an app
export let valtio = (n = rows, shown = 100, sync = true) => {
  let store = proxy({items: proxyMap(entries(n)), step: 0})
  let count = counter()
  let next = stepper(n, shown)

  let Row = memo(({id}) => {
    count.hit()

    let snap = useSnapshot(store, {sync})
    let item = snap.items.get(id)

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let snap = useSnapshot(store, {sync})
    let ids = page(snap.items.keys(), shown, snap.step)

    return h('ul', null, ids.map(id => h(Row, {key: id, id})))
  }

  return {
    store,
    count,
    element: h(App),
    step: () => store.step = next(store.step),
  }
}

export let mobx = (n = rows, shown = 100) => {
  let store = observable({items: new Map(entries(n)), step: 0})
  let count = counter()
  let next = stepper(n, shown)

  let Row = observer(({id}) => {
    count.hit()

    let item = store.items.get(id)

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = observer(() => {
    count.hit()

    let ids = page(store.items.keys(), shown, store.step)

    return h('ul', null, ids.map(id => h(Row, {key: id, id})))
  })

  return {
    store,
    count,
    element: h(App),
    step: () => runInAction(() => store.step = next(store.step)),
  }
}

// no store at all: the map never changes, the page number is react state.
// What React costs by itself, so the rest of the table is read against it
export let basic = (n = rows, shown = 100) => {
  let count = counter()
  let store = new Map(entries(n))
  let next = stepper(n, shown)
  let setStep

  let Row = memo(({item}) => {
    count.hit()

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let [step, set] = useState(0)
    setStep = set

    let ids = page(store.keys(), shown, step)

    return h('ul', null, ids.map(id => h(Row, {key: id, item: store.get(id)})))
  }

  return {
    store,
    count,
    element: h(App),
    step: () => setStep(next),
  }
}
