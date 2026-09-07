import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create(new Map([[1, 1]]))
//
//   // bench
//   store.get(1)

loop('Get number value from Map')
  .all({run: m => m.get(1)})
  .picofly({make: () => track(create(new Map([[1, 1]])))})
  .valtio({make: () => snap(proxyMap([[1, 1]]))})
  .mobx({make: () => observable.map(new Map([[1, 1]])), enter: derived})
  .run()
