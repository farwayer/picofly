import {loop} from '../../utils.js'
import {mount} from '../utils.js'
import * as apps from '../apps-obj.js'


// show:
//   // 1000 records in a dictionary, a page of 100 of them on screen
//   let app = create({items: {0: {id: 0, name: 'item 0'}, ...}})
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
  .basic({make: () => apps.basic(records, shown)})
  .run()
