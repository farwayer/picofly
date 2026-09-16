import {loop} from '../../utils.js'
import {commit, mount} from '../utils.js'
import * as apps from '../apps-map.js'


// show:
//   // 1000 records by id, every one of them on screen
//
//   // App
//   for (let id of app.items.keys()) ids.push(id)
//
//   // Row
//   let {name, done} = app.items.get(id)
//
//   // bench: 200 records arrive, half of them the collection has not seen
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
let batch = 100

// the collection grows while a region runs, so every region gets its own app
let make = name => () => {
  // valtio only: the op flushes itself, so its sync mode is off
  let app = apps[name](records, Infinity, false)
  mount(app.element)

  return app
}

// what a server would have sent: the first hundred records patched, a hundred
// more that are new. Ready before the clock, one batch per op of a region
let batches = Array.from({length: 5}, (_, i) => [
  ...Array.from({length: batch}, (_, id) => ({
    id,
    name: `item ${id} v${i}`,
    done: (i & 1) === 0,
  })),
  ...Array.from({length: batch}, (_, at) => {
    let id = records + i * batch + at

    return {id, name: 'item ' + id, done: false}
  }),
])

loop(`Upsert ${batch} records into ${records}, ${batch} of them new`)
  .all({
    flush: true,
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 5,
    warm: 5,
    run: async (app, i) => {
      await commit(() => app.upsert(batches[i % batches.length]))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
