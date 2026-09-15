import {loop} from '../../utils.js'
import {data, flushSync, mount, rows} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench
//   app.items = freshItems

let make = name => {
  let app

  return () => {
    if (!app) {
      app = apps[name]()
      mount(app.element)
    }

    return app
  }
}

loop(`Replace all ${rows} rows`)
  .all({
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 20,
    warm: 10,
    run: (app, i) => {
      flushSync(() => app.replace(app.next[i & 1]))
    },
  })
  .picofly({make: withLists('picofly')})
  .valtio({make: withLists('valtio')})
  .mobx({make: withLists('mobx')})
  .zustand({make: withLists('zustand')})
  .basic({make: withLists('basic')})
  .run()

function withLists(name) {
  let build = make(name)

  return () => {
    let app = build()
    app.next ??= [list(1), list(2)]

    return app
  }
}

// the two lists differ in every row. On equal values a library that compares
// them skips the render, and the swap measures nothing
function list(v) {
  return data().items.map(item => ({
    ...item,
    name: `${item.name} v${v}`,
    done: v > 1,
  }))
}
