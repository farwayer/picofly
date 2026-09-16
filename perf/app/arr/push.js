import {loop} from '../../utils.js'
import {commit, mount} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench: a row on the end, and it stays
//   app.items.push({id: 1000, name: 'item 1000', done: false})

let records = 1000

// the list grows while a region runs, so every region gets its own app
let make = name => () => {
  // valtio only: the op flushes itself, so its sync mode is off
  let app = apps[name](records, Infinity, false)
  mount(app.element)

  return app
}

loop(`Add a row to ${records}`)
  .all({
    // a push writes the index and the length, so valtio gets to coalesce
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 30,
    warm: 20,
    run: async (app, i) => {
      await commit(() => app.push({id: records + i, name: 'item ' + i, done: false}))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
