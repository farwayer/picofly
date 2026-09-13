import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 slots, every other one a hole
//   let store = create([0, , 2, , 4, ...])
//
//   // bench
//   store.length = 0

let fill = () => {
  let a = []
  a.length = 100

  for (let i = 0; i < 100; i += 2) {
    a[i] = i
  }

  return a
}

loop('Cut sparse array of 100 slots to nothing')
  .all({
    fresh: true,
    n: 2000,
    run: a => {
      a.length = 0
    },
  })
  .picofly({make: () => watch(create(fill()))})
  .valtio({make: () => sub(proxy(fill()))})
  .mobx({make: () => obs(observable.array(fill()))})
  .run()
