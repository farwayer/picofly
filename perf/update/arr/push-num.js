import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create([])
//
//   // bench
//   store.push(1)

loop('Push number to array')
  .all({fresh: true, run: (a, i) => a.push(i)})
  .picofly({make: () => watch(create([]))})
  .valtio({make: () => sub(proxy([]))})
  .mobx({make: () => obs(observable.array([]))})
  .run()
