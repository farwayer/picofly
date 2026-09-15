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
//   // bench: a row goes away, out of the middle of the list
//   app.items.splice(500, 1)

let middle = rows / 2

// the list shrinks while a region runs, so every region gets its own app
let make = name => () => {
  // valtio only: the op flushes itself, so its sync mode is off
  let app = apps[name](rows, Infinity, false)
  mount(app.element)

  return app
}

loop(`Delete a row of ${rows}`)
  .all({
    // a splice writes every index after it, so valtio gets to coalesce
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 30,
    warm: 20,
    run: async app => {
      await commit(() => app.drop(middle))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
