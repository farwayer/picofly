import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create({n: 1})
//
//   // bench
//   store.n

loop('Get number value from object')
  .all({run: s => s.n})
  .picofly({make: () => track(create({n: 1}))})
  .valtio({make: () => snap(proxy({n: 1}))})
  .mobx({make: () => observable.object({n: 1}), enter: derived})
  .run()
