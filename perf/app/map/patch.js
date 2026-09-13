import {loop} from '../../utils.js'
import {commit, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // 1000 records by id, a page of 100 of them on screen
//
//   // bench: a batch of records arrives, all of them already in the map
//   for (let obj of batch) {
//     let item = app.items.get(obj.id)
//     item ? Object.assign(item, obj) : app.items.set(obj.id, obj)
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

loop(`Patch ${shown} records of ${records}`)
  .all({
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 30,
    warm: 20,
    run: async (app, i) => {
      let batch = Array.from({length: shown}, (_, id) => ({
        id,
        name: `item ${id} v${i}`,
        done: (i & 1) === 0,
      }))

      await commit(() => app.upsert(batch))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .basic({make: make('basic')})
  .run()
