import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create([1])
//
//   // bench
//   store[0]

loop('Get number value from array')
  .all({run: a => a[0]})
  .picofly({make: () => track(create([1]))})
  .valtio({make: () => snap(proxy([1]))})
  .mobx({make: () => observable.array([1]), enter: derived})
  .run()
