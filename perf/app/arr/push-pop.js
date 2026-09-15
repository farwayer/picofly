import {loop} from '../../utils.js'
import {commit, mount, rows} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench
//   app.items.push({id: 1000, name: 'item 1000', done: false})
//   app.items.pop()

let make = name => {
  let app

  return () => {
    if (!app) {
      // valtio only: the op flushes itself, so its sync mode is off
      app = apps[name](rows, Infinity, false)
      mount(app.element)
    }

    return app
  }
}

loop(`Add and drop a row of ${rows}`)
  .all({
    // a push writes the index and the length, so valtio gets to coalesce
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 30,
    warm: 20,
    run: async (app, i) => {
      await commit(() => app.push({id: rows + i, name: 'item ' + i, done: false}))
      await commit(() => app.pop())
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
