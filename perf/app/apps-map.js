// the same records keyed by id: a page of rows, each row reading its own
// object out of the map. Updates arrive as whole records, the way a server
// sends them — patch the one already there, add the one that is not
import {create} from 'picofly'
// the react entry pulls select.jsx, which node cannot load
import {useStore} from '../../src/react/use-store.js'
import {proxy, useSnapshot} from 'valtio'
import {proxyMap} from 'valtio/utils'
import {observable, runInAction} from 'mobx'
import {observer} from 'mobx-react-lite'
import {createStore} from 'zustand/vanilla'
import {useStore as useZustand} from 'zustand'
import {memo, useState} from 'react'
import {h, data, counter, rows} from './utils.js'

let entries = n => data(n).items.map(item => [item.id, item])

// the ids on screen, taken off the front without touching the rest
let page = (items, shown) => {
  let ids = []

  for (let id of items.keys()) {
    if (ids.length === shown) break
    ids.push(id)
  }

  return ids
}

export let picofly = (n = rows, shown = Infinity) => {
  let store = create({items: new Map(entries(n))})
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let app = useStore(store)
    let item = app.items.get(id)

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
    replace: items => {
      store.items = items
    },
    add: record => {
      store.items.set(record.id, record)
    },
    patch: records => {
      for (let obj of records) {
        Object.assign(store.items.get(obj.id), obj)
      }
    },
    upsert: records => {
      for (let obj of records) {
        let item = store.items.get(obj.id)

        if (item) {
          Object.assign(item, obj)
        } else {
          store.items.set(obj.id, obj)
        }
      }
    },
    drop: id => store.items.delete(id),
  }
}

// sync mode by default: inside a sync region valtio has no other way to
// commit. A bench whose op flushes itself passes false and lets valtio
// coalesce its notifications the way it does in an app
export let valtio = (n = rows, shown = Infinity, sync = true) => {
  let store = proxy({items: proxyMap(entries(n))})
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let snap = useSnapshot(store, {sync})
    let item = snap.items.get(id)

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
    replace: items => {
      store.items = proxyMap(items)
    },
    add: record => {
      store.items.set(record.id, record)
    },
    patch: records => {
      for (let obj of records) {
        Object.assign(store.items.get(obj.id), obj)
      }
    },
    upsert: records => {
      for (let obj of records) {
        let item = store.items.get(obj.id)

        if (item) {
          Object.assign(item, obj)
        } else {
          store.items.set(obj.id, obj)
        }
      }
    },
    drop: id => store.items.delete(id),
  }
}

export let mobx = (n = rows, shown = Infinity) => {
  let store = observable({items: new Map(entries(n))})
  let count = counter()

  let Row = observer(({id}) => {
    count.hit()

    let item = store.items.get(id)

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
    replace: items => runInAction(() => {
      store.items = items
    }),
    add: record => runInAction(() => store.items.set(record.id, record)),
    patch: records => runInAction(() => {
      for (let obj of records) {
        Object.assign(store.items.get(obj.id), obj)
      }
    }),
    upsert: records => runInAction(() => {
      for (let obj of records) {
        let item = store.items.get(obj.id)

        if (item) {
          Object.assign(item, obj)
        } else {
          store.items.set(obj.id, obj)
        }
      }
    }),
    drop: id => runInAction(() => store.items.delete(id)),
  }
}

export let zustand = (n = rows, shown = Infinity) => {
  let store = createStore(() => ({items: new Map(entries(n))}))
  let count = counter()

  let Row = memo(({id}) => {
    count.hit()

    let item = useZustand(store, s => s.items.get(id))

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
    replace: items => store.setState({items}),
    add: record => store.setState(s => ({
      items: new Map(s.items).set(record.id, record),
    })),
    // the whole batch lands in one new map
    patch: records => store.setState(s => {
      let next = new Map(s.items)

      for (let obj of records) {
        next.set(obj.id, {...next.get(obj.id), ...obj})
      }

      return {items: next}
    }),
    upsert: records => store.setState(s => {
      let next = new Map(s.items)

      for (let obj of records) {
        let item = next.get(obj.id)
        next.set(obj.id, item ? {...item, ...obj} : obj)
      }

      return {items: next}
    }),
    drop: id => store.setState(s => {
      let next = new Map(s.items)
      next.delete(id)
      return {items: next}
    }),
  }
}

// no store at all: the map lives in state and every update rebuilds it.
// What React costs by itself, so the rest of the table is read against it
export let basic = (n = rows, shown = Infinity) => {
  let count = counter()
  let store = new Map(entries(n))
  let setItems

  let Row = memo(({item}) => {
    count.hit()

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let [items, set] = useState(store)
    setItems = set

    return h('ul', null, page(items, shown)
      .map(id => h(Row, {key: id, item: items.get(id)})))
  }

  return {
    store,
    count,
    element: h(App),
    replace: items => setItems(items),
    add: record => setItems(items => new Map(items).set(record.id, record)),
    // immutable updates, so the whole batch lands in one new map
    patch: records => setItems(items => {
      let next = new Map(items)

      for (let obj of records) {
        next.set(obj.id, {...next.get(obj.id), ...obj})
      }

      return next
    }),
    upsert: records => setItems(items => {
      let next = new Map(items)

      for (let obj of records) {
        let item = next.get(obj.id)
        next.set(obj.id, item ? {...item, ...obj} : obj)
      }

      return next
    }),
    drop: id => setItems(items => {
      let next = new Map(items)
      next.delete(id)
      return next
    }),
  }
}
