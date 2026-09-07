import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create([0])
//
//   // bench
//   store[0] = 1

loop('Set number to array')
  .all({
    fresh: true,
    run: (a, i) => {
      a[0] = i
    },
  })
  .picofly({make: () => watch(create([0]))})
  .valtio({make: () => sub(proxy([0]))})
  .mobx({make: () => obs(observable.array([0]))})
  .run()
