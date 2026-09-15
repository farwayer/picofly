import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // 100 records by id, every one of them on screen
//
//   // App
//   for (let id of app.items.keys()) ids.push(id)
//
//   // Row
//   let {name, done} = app.items.get(id)
//
//   // bench: a record goes away, out of the middle of the collection
//   app.items.delete(50)

let records = 100
let first = 50

// the collection shrinks while a region runs, so every region gets its own app
let make = name => () => {
  let app = apps[name](records)
  mount(app.element)

  return app
}

loop(`Delete a record of ${records}`)
  .all({
    n: 30,
    warm: 20,
    run: (app, i) => {
      flushSync(() => app.drop(first + i))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
