import {loop} from '../../utils.js'
import {flushSync, mount} from '../utils.js'
import * as apps from '../apps-map-page.js'


// show:
//   // 1000 records by id, a page of 100 of them on screen
//   let app = create({
//     items: new Map([[0, {id: 0, name: 'item 0'}], ...]),
//     step: 0,
//   })
//
//   // App, every render takes the ids of the page it is on
//   app.items.keys().drop(app.step * 100).take(100)
//
//   // Row
//   let {name, done} = app.items.get(id)
//
//   // bench
//   app.step++

// one mount per process: every region switches pages on the same live app,
// the way a user would, and nobody pays for a thousand rows twelve times
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

loop(`Switch to the next page of ${shown} in ${records} records`)
  .all({
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 100,
    warm: 50,
    run: app => {
      flushSync(() => app.step())
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
