import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create([])
//
//   // bench
//   for (let i = 0; i < 100; i++) store.push({i})

// a batch of pushes, where the array grows and reallocates
let put = a => {
  for (let i = 0; i < 100; i++) {
    a.push({i})
  }
}

loop('Push 100 objects into array')
  .all({fresh: true, n: 200, repeats: 8, run: put})
  .picofly({make: () => watch(create([]))})
  .valtio({make: () => sub(proxy([]))})
  .mobx({make: () => obs(observable.array([]))})
  .run()
