import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 numbers
//   let store = create([0, 1, 2, ...])
//
//   // bench
//   store.length = 0

let fill = () => {
  let a = []

  for (let i = 0; i < 100; i++) {
    a.push(i)
  }

  return a
}

loop('Cut array of 100 numbers to nothing')
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
