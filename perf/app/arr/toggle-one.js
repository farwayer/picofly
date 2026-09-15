import {loop} from '../../utils.js'
import {flushSync, mount, rows} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench
//   let item = app.items[500]
//   item.done = !item.done

// one mount per process: every region toggles the same live app, the way a
// user would, and nobody pays for a thousand rows twelve times over
let make = name => {
  let app

  return () => {
    if (!app) {
      app = apps[name]()
      mount(app.element)
    }

    return app
  }
}

let mid = rows >> 1

loop(`Toggle one row of ${rows}`)
  .all({
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 100,
    warm: 50,
    run: app => {
      flushSync(() => app.toggle(mid))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .zustand({make: make('zustand')})
  .basic({make: make('basic')})
  .run()
