import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create({c: {}})
//
//   // bench
//   store.c

loop('Get object value from object, cold')
  .all({fresh: true, run: s => s.c})
  .picofly({make: () => track(create({c: {}}))})
  .valtio({make: () => snap(proxy({c: {}}))})
  .mobx({make: () => observable.object({c: {}}), enter: derived})
  .run()
