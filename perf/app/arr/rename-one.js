import {loop} from '../../utils.js'
import {flushSync, mount, rows} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // bench
//   app.items[500].name = 'item 500 again'

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

loop(`Rename one row of ${rows}`)
  .all({
    // an app op is hundreds of microseconds, so the counts are set by hand
    n: 100,
    warm: 50,
    run: (app, i) => {
      flushSync(() => app.rename(mid, 'item ' + i))
    },
  })
  .picofly({make: make('picofly')})
  .valtio({make: make('valtio')})
  .mobx({make: make('mobx')})
  .basic({make: make('basic')})
  .run()
