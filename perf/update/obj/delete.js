import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create({x: 1})
//
//   // bench
//   delete store.x

loop('Delete number prop from object')
  .all({fresh: true, run: o => delete o.x})
  .picofly({make: () => watch(create({x: 1}))})
  .valtio({make: () => sub(proxy({x: 1}))})
  .mobx({make: () => obs(observable.object({x: 1}))})
  .run()
