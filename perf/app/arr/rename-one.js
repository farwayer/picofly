import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench
//   app.items[500].name = 'item 500 again'

let records = 1000

let make = name => {
  let app

  return () => {
    if (!app) {
      app = apps[name](records)
      mount(app.element)
    }

    return app
  }
}

let mid = records >> 1

loop(`Rename one row of ${records}`)
  .all({
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 100,
    warm: 50,
    run: (app, i) => {
      flushSync(() => app.rename(mid, 'item ' + i))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
