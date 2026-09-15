import {loop} from '../../utils.js'
import {commit, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // 1000 records by id, a page of 100 of them on screen
//
//   // App, until the page is full
//   for (let id of app.items.keys()) ids.push(id)
//
//   // Row
//   let {name, done} = app.items.get(id)
//
//   // bench: a batch of records arrives, all of them already in the map
//   for (let obj of batch) {
//     let item = app.items.get(obj.id)
//
//     if (item) {
//       Object.assign(item, obj)
//     } else {
//       app.items.set(obj.id, obj)
//     }
//   }

// the whole batch lands in one commit, so every library flushes the way it
// does in an app: valtio coalesces its notifications in a microtask, the
// other two notify while writing

let records = 1000
let shown = 100

let make = name => {
  let app

  return () => {
    if (!app) {
      // valtio only: the op flushes itself, so its sync mode is off
      app = apps[name](records, shown, false)
      mount(app.element)
    }

    return app
  }
}

// the payload a server would have sent, ready before the clock. Two of them,
// so every op writes values the previous one did not
let batches = [0, 1].map(v => Array.from({length: shown}, (_, id) => ({
  id,
  name: `item ${id} v${v}`,
  done: v === 0,
})))

loop(`Patch ${shown} records of ${records}`)
  .all({
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 30,
    warm: 20,
    run: async (app, i) => {
      await commit(() => app.upsert(batches[i & 1]))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
