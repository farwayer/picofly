import {loop} from '../../utils.js'
import {mount} from '../utils.js'
import * as apps from '../apps-obj.js'


// show:
//   // 1000 records in a dictionary, every one of them on screen
//   let app = create({items: {0: {id: 0, name: 'item 0'}, ...}})
//
//   // App
//   for (let id in app.items) ids.push(id)
//
//   // Row
//   let {name, done} = app.items[id]
//
//   // bench
//   root.render(<App/>)

let records = 1000

loop(`Mount ${records} rows`)
  .all({
    fresh: true,
    // a mount is milliseconds, so a handful of them fills a region
    n: 10,
    warm: 3,
    repeats: 5,
    run: app => mount(app.element),
  })
  .picofly({make: () => apps.picofly(records)})
  .valtio({make: () => apps.valtio(records)})
  .mobx({make: () => apps.mobx(records)})
  .zustand({make: () => apps.zustand(records)})
  .basic({make: () => apps.basic(records)})
  .run()
