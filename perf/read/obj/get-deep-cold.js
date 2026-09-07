import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create({c: {x: {y: {z: 1}}}})
//
//   // bench
//   store.c.x.y.z

loop('Get deep object value from object, cold')
  .all({fresh: true, run: s => s.c.x.y.z})
  .picofly({make: () => track(create({c: {x: {y: {z: 1}}}}))})
  .valtio({make: () => snap(proxy({c: {x: {y: {z: 1}}}}))})
  .mobx({make: () => observable.object({c: {x: {y: {z: 1}}}}), enter: derived})
  .run()
