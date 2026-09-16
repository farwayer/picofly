import {loop} from '../../utils.js'
import {commit, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // an empty store, a page of 1000 rows waiting for data
//   let app = create({items: new Map()})
//
//   // App, until the page is full
//   for (let id of app.items.keys()) ids.push(id)
//
//   // Row
//   let {name, done} = app.items.get(id)
//
//   // bench: 10k records arrive, the first 1000 of them reach the screen
//   app.items = newItems

let records = 10000
let shown = 1000

// the app is mounted empty and the payload is ready, so the clock starts
// where the data does
let make = name => () => {
  // valtio only: the op flushes itself, so its sync mode is off
  let app = apps[name](0, shown, false)
  mount(app.element)

  app.next = new Map(Array.from({length: records}, (_, id) => [
    id,
    {id, name: 'item ' + id, done: false},
  ]))

  return app
}

loop(`Take ${records} records in, render the first ${shown}`)
  .all({
    fresh: true,
    flush: true,
    // tens of milliseconds an op, so a few of them fill a region
    n: 5,
    warm: 2,
    repeats: 5,
    run: async app => {
      await commit(() => app.replace(app.next))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
