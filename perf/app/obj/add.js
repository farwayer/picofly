import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-obj.js'


// show:
//   // 1000 records in a dictionary, every one of them on screen
//
//   // App
//   for (let id in app.items) ids.push(id)
//
//   // Row
//   let {name, done} = app.items[id]
//
//   // bench: one record the collection has never seen, and it stays
//   app.items[1000] = {id: 1000, name: 'item 1000', done: false}

let records = 1000

// the collection grows while a region runs, so every region gets its own app
let make = name => () => {
  let app = apps[name](records)
  mount(app.element)

  return app
}

loop(`Add a record to ${records}`)
  .all({
    n: 30,
    warm: 20,
    run: (app, i) => {
      let id = records + i

      flushSync(() => app.add({id, name: 'item ' + id, done: false}))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
