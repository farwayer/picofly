// the same records in a plain object keyed by id: a page of rows, each row
// reading its own object out of the dictionary. Updates arrive as whole
// records — patch the one already there, add the one that is not
import {create} from 'picofly'
// the react entry pulls select.jsx, which node cannot load
import {useStore} from '../../src/react/use-store.js'
import {proxy, useSnapshot} from 'valtio'
import {observable, runInAction} from 'mobx'
import {observer} from 'mobx-react-lite'
import {createStore} from 'zustand/vanilla'
import {useStore as useZustand} from 'zustand'
import {memo, useState} from 'react'
import {h, data, counter, rows} from './utils.js'

let dict = n => Object.fromEntries(data(n).items.map(item => [item.id, item]))

// the ids on screen, taken off the front without touching the rest
let page = (items, shown) => {
  let ids = []

  for (let id in items) {
    if (ids.length === shown) break
    ids.push(id)
  }

  return ids
}

export let picofly = (n = rows, shown = Infinity) => {
  let store = create({items: dict(n)})
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let app = useStore(store)
    let item = app.items[id]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let app = useStore(store)

    return h('ul', null, page(app.items, shown).map(id => h(Row, {key: id, id})))
  }

  return {
    store,
    count,
    element: h(App),
    upsert: records => {
      for (let obj of records) {
        let item = store.items[obj.id]

        if (item) Object.assign(item, obj)
        else store.items[obj.id] = obj
      }
    },
    drop: id => delete store.items[id],
  }
}

// sync mode by default: inside a sync region valtio has no other way to
// commit. A bench whose op flushes itself passes false and lets valtio
// coalesce its notifications the way it does in an app
export let valtio = (n = rows, shown = Infinity, sync = true) => {
  let store = proxy({items: dict(n)})
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let snap = useSnapshot(store, {sync})
    let item = snap.items[id]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let snap = useSnapshot(store, {sync})

    return h('ul', null, page(snap.items, shown).map(id => h(Row, {key: id, id})))
  }

  return {
    store,
    count,
    element: h(App),
    upsert: records => {
      for (let obj of records) {
        let item = store.items[obj.id]

        if (item) Object.assign(item, obj)
        else store.items[obj.id] = obj
      }
    },
    drop: id => delete store.items[id],
  }
}

export let mobx = (n = rows, shown = Infinity) => {
  let store = observable({items: dict(n)})
  let count = counter()

  let Row = observer(({id}) => {
    count.hit()

    let item = store.items[id]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = observer(() => {
    return h('ul', null, page(store.items, shown).map(id => h(Row, {key: id, id})))
  })

  return {
    store,
    count,
    element: h(App),
    // one action for the batch, the way a mobx app takes a server payload
    upsert: records => runInAction(() => {
      for (let obj of records) {
        let item = store.items[obj.id]

        if (item) Object.assign(item, obj)
        else store.items[obj.id] = obj
      }
    }),
    drop: id => runInAction(() => delete store.items[id]),
  }
}

export let zustand = (n = rows, shown = Infinity) => {
  let store = createStore(() => ({items: dict(n)}))
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let item = useZustand(store, s => s.items[id])

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let items = useZustand(store, s => s.items)

    return h('ul', null, page(items, shown).map(id => h(Row, {key: id, id})))
  }

  return {
    store,
    count,
    element: h(App),
    // the whole batch lands in one new dictionary
    upsert: records => store.setState(s => {
      let next = {...s.items}

      for (let obj of records) {
        let item = next[obj.id]
        next[obj.id] = item ? {...item, ...obj} : obj
      }

      return {items: next}
    }),
    drop: id => store.setState(s => {
      let next = {...s.items}
      delete next[id]
      return {items: next}
    }),
  }
}

// no store at all: the dictionary lives in state and every update rebuilds
// it. What React costs by itself, so the rest of the table is read against it
export let basic = (n = rows, shown = Infinity) => {
  let count = counter()
  let store = dict(n)
  let setItems

  let Row = memo(({item}) => {
    count.hit()

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let [items, set] = useState(store)
    setItems = set

    return h('ul', null, page(items, shown)
      .map(id => h(Row, {key: id, item: items[id]})))
  }

  return {
    store,
    count,
    element: h(App),
    // immutable updates, so the whole batch lands in one new dictionary
    upsert: records => setItems(items => {
      let next = {...items}

      for (let obj of records) {
        let item = next[obj.id]
        next[obj.id] = item ? {...item, ...obj} : obj
      }

      return next
    }),
    drop: id => setItems(items => {
      let next = {...items}
      delete next[id]
      return next
    }),
  }
}
