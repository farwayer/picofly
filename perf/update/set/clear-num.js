import {proxySet} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 numbers
//   let store = create(new Set([0, 1, ...]))
//
//   // bench
//   store.clear()

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push(i)
  }

  return new Set(e)
}

loop('Clear Set with 100 numbers')
  .all({fresh: true, n: 2000, run: s => s.clear()})
  .picofly({make: () => watch(create(fill()))})
  .valtio({make: () => sub(proxySet(fill()))})
  .mobx({make: () => obs(observable.set(fill()))})
  .run()
