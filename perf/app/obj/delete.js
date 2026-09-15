import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-obj.js'


// show:
//   // 100 records in a dictionary, every one of them on screen
//
//   // App
//   for (let id in app.items) ids.push(id)
//
//   // Row
//   let {name, done} = app.items[id]
//
//   // bench: a record goes away, out of the middle of the collection
//   delete app.items[50]

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
