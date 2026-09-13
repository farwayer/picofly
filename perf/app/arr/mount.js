import {loop} from '../../utils.js'
import {mount, rows} from '../utils.js'
import * as apps from '../apps.js'


// show:
//   // 1000 rows, every row a component on its own item
//   let app = create({items: [{id: 0, name: 'item 0', done: false}, ...]})
//
//   // bench
//   root.render(<App/>)

loop(`Mount ${rows} rows`)
  .all({
    fresh: true,
    // a mount is milliseconds, so a handful of them fills a region
    n: 10,
    warm: 3,
    repeats: 5,
    run: app => mount(app.element),
  })
  .picofly({make: () => apps.picofly()})
  .valtio({make: () => apps.valtio()})
  .mobx({make: () => apps.mobx()})
  .basic({make: () => apps.basic()})
  .run()
