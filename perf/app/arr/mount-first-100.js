import {loop} from '../../utils.js'
import {mount} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 records in the store, a page of 100 of them on screen
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // Row
//   let {name, done} = app.items[i]
//
//   // bench
//   root.render(<App/>)

let records = 1000
let shown = 100

loop(`Mount ${shown} rows of ${records} records`)
  .all({
    fresh: true,
    // a mount is milliseconds, so a handful of them fills a region
    n: 10,
    warm: 3,
    repeats: 5,
    run: app => mount(app.element),
  })
  .picofly({make: () => apps.picofly(records, shown)})
  .valtio({make: () => apps.valtio(records, shown)})
  .mobx({make: () => apps.mobx(records, shown)})
  .zustand({make: () => apps.zustand(records, shown)})
  .basic({make: () => apps.basic(records, shown)})
  .run()
