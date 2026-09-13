// the same list in three bindings: a header on the length, a row on its item
import {create} from 'picofly'
// the react entry pulls select.jsx, which node cannot load
import {useStore} from '../../src/react/use-store.js'
import {proxy, useSnapshot} from 'valtio'
import {observable, runInAction} from 'mobx'
import {observer} from 'mobx-react-lite'
import {memo, useState} from 'react'
import {h, data, counter, rows} from './utils.js'

export let picofly = (n = rows, shown = Infinity) => {
  let store = create(data(n))
  let count = counter()

  let Row = memo(({i}) => {
    count.hit()

    let app = useStore(store)
    let item = app.items[i]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let app = useStore(store)

    return h('ul', null, Array.from({length: Math.min(app.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  }

  return {
    store,
    count,
    element: h(App),
    toggle: (i, done) => {
      store.items[i].done = done
    },
    rename: (i, name) => {
      store.items[i].name = name
    },
    push: item => store.items.push(item),
    pop: () => store.items.pop(),
    replace: items => {
      store.items = items
    },
  }
}

// sync mode by default: inside a sync region valtio has no other way to
// commit. A bench whose op flushes itself passes false and lets valtio
// coalesce its notifications the way it does in an app
export let valtio = (n = rows, shown = Infinity, sync = true) => {
  let store = proxy(data(n))
  let count = counter()

  let Row = memo(({i}) => {
    count.hit()

    let snap = useSnapshot(store, {sync})
    let item = snap.items[i]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let snap = useSnapshot(store, {sync})

    return h('ul', null, Array.from({length: Math.min(snap.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  }

  return {
    store,
    count,
    element: h(App),
    toggle: (i, done) => {
      store.items[i].done = done
    },
    rename: (i, name) => {
      store.items[i].name = name
    },
    push: item => store.items.push(item),
    pop: () => store.items.pop(),
    replace: items => {
      store.items = items
    },
  }
}

export let mobx = (n = rows, shown = Infinity) => {
  let store = observable(data(n))
  let count = counter()

  let Row = observer(({i}) => {
    count.hit()

    let item = store.items[i]

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = observer(() => {
    count.hit()

    return h('ul', null, Array.from({length: Math.min(store.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  })

  return {
    store,
    count,
    element: h(App),
    toggle: (i, done) => runInAction(() => {
      store.items[i].done = done
    }),
    rename: (i, name) => runInAction(() => {
      store.items[i].name = name
    }),
    push: item => runInAction(() => store.items.push(item)),
    pop: () => runInAction(() => store.items.pop()),
    replace: items => runInAction(() => {
      store.items = items
    }),
  }
}

// no store at all: the row keeps its own state. What React costs by itself,
// so the rest of the table is read against it
export let basic = (n = rows, shown = Infinity) => {
  let count = counter()
  let store = data(n)
  let setItems

  let Row = memo(({item}) => {
    count.hit()

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    count.hit()

    let [items, set] = useState(store.items)
    setItems = set

    let page = shown < items.length ? items.slice(0, shown) : items

    return h('ul', null, page.map((item, i) => h(Row, {key: i, item})))
  }

  // immutable updates, the way an app without a store does it
  let swap = (i, patch) => setItems(items => items.map(
    (item, at) => at === i ? {...item, ...patch} : item))

  return {
    store,
    count,
    element: h(App),
    toggle: (i, done) => swap(i, {done}),
    rename: (i, name) => swap(i, {name}),
    push: item => setItems(items => [...items, item]),
    pop: () => setItems(items => items.slice(0, -1)),
    replace: items => setItems(items),
  }
}
