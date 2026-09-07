import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   let store = create([{n: 1}])
//   store[0]
//
//   // bench
//   store[0]

loop('Get object value from array, cached')
  .all({run: a => a[0]})
  .picofly({make: () => track(create([{n: 1}]))})
  .valtio({make: () => snap(proxy([{n: 1}]))})
  .mobx({make: () => observable.array([{n: 1}]), enter: derived})
  .run()
