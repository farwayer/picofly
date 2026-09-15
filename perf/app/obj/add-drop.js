import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-obj.js'


// show:
//   // 1000 records in a dictionary, a page of 100 of them on screen
//
//   // App, until the page is full
//   for (let id in app.items) ids.push(id)
//
//   // Row
//   let {name, done} = app.items[id]
//
//   // bench: one record the dictionary has never seen, then gone again
//   app.items[1000] = {id: 1000, name: 'item 1000', done: false}
//   delete app.items[1000]

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
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
