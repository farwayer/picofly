import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create({x: 1})
//
//   // bench
//   store.x = 1

// a form writes back what it already holds, a response repeats itself:
// the value did not change, so nobody should be woken up
loop('Set the same number to object')
  .all({
    run: s => {
      s.x = 1
    },
  })
  .picofly({make: () => watch(create({x: 1}))})
  .valtio({make: () => sub(proxy({x: 1}))})
  .mobx({make: () => obs(observable.object({x: 1}))})
  .run()
