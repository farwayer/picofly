// the same list in three bindings: a header on the length, a row on its item
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
    let app = useStore(store)

    return h('ul', null, Array.from({length: Math.min(app.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  }

  return {
    store,
    count,
    element: h(App),
    toggle: i => {
      let item = store.items[i]
      item.done = !item.done
    },
    rename: (i, name) => {
      store.items[i].name = name
    },
    push: item => store.items.push(item),
    drop: i => store.items.splice(i, 1),
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
    let snap = useSnapshot(store, {sync})

    return h('ul', null, Array.from({length: Math.min(snap.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  }

  return {
    store,
    count,
    element: h(App),
    toggle: i => {
      let item = store.items[i]
      item.done = !item.done
    },
    rename: (i, name) => {
      store.items[i].name = name
    },
    push: item => store.items.push(item),
    drop: i => store.items.splice(i, 1),
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
    return h('ul', null, Array.from({length: Math.min(store.items.length, shown)},
      (_, i) => h(Row, {key: i, i})))
  })

  return {
    store,
    count,
    element: h(App),
    toggle: i => runInAction(() => {
      let item = store.items[i]
      item.done = !item.done
    }),
    rename: (i, name) => runInAction(() => {
      store.items[i].name = name
    }),
    push: item => runInAction(() => store.items.push(item)),
    drop: i => runInAction(() => store.items.splice(i, 1)),
    replace: items => runInAction(() => {
      store.items = items
    }),
  }
}

export let zustand = (n = rows, shown = Infinity) => {
  let store = createStore(() => data(n))
  let count = counter()

  let Row = memo(({i}) => {
    count.hit()

    let item = useZustand(store, s => s.items[i])

    return h('li', null, item.name, item.done ? ' done' : '')
  })

  let App = () => {
    let length = useZustand(store, s => Math.min(s.items.length, shown))

    return h('ul', null, Array.from({length}, (_, i) => h(Row, {key: i, i})))
  }

  // immutable updates, the way a zustand app does them
  let swap = (i, patch) => store.setState(s => ({
    items: s.items.map((item, at) => at === i ? {...item, ...patch} : item),
  }))

  return {
    store,
    count,
    element: h(App),
    toggle: i => store.setState(s => ({
      items: s.items.map((item, at) => (
        at === i ? {...item, done: !item.done} : item
      )),
    })),
    rename: (i, name) => swap(i, {name}),
    push: item => store.setState(s => ({items: [...s.items, item]})),
    drop: i => store.setState(s => ({items: s.items.toSpliced(i, 1)})),
    replace: items => store.setState({items}),
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
    toggle: i => setItems(items => items.map(
      (item, at) => at === i ? {...item, done: !item.done} : item)),
    rename: (i, name) => swap(i, {name}),
    push: item => setItems(items => [...items, item]),
    drop: i => setItems(items => items.toSpliced(i, 1)),
    replace: items => setItems(items),
  }
}
