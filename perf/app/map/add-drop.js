import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // 1000 records by id, a page of 100 of them on screen
//
//   // bench: one record the map has never seen, then gone again
//   app.items.set(1000, {id: 1000, name: 'item 1000', done: false})
//   app.items.delete(1000)

let records = 1000
let shown = 100

let make = name => {
  let app

  return () => {
    if (!app) {
      app = apps[name](records, shown)
      mount(app.element)
    }

    return app
  }
}

loop(`Add and drop a record of ${records}`)
  .all({
    n: 30,
    warm: 20,
    run: (app, i) => {
      let id = records + i

      flushSync(() => app.upsert([{id, name: 'item ' + id, done: false}]))
      flushSync(() => app.drop(id))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .basic({make: make('basic')})
  .run()
