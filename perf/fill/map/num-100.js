import {proxy} from 'valtio'
import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 entries
//   let data = new Map([[0, 0], ...])
//
//   // bench
//   store.data = data

// the backend answered and the whole thing goes into a store prop
let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, i])
  }

  return new Map(e)
}

loop('Put Map of 100 numbers into a store prop')
  .all({
    fresh: true,
    n: 200,
    repeats: 8,
    run: ({store, data}) => {
      store.data = data
    },
  })
  .picofly({make: () => ({store: watch(create({})), data: fill()})})
  .valtio({
    make: () => ({store: sub(proxy({})), data: fill()}),
    // a plain Map is not reactive in valtio, it has to be wrapped on the way in
    run: ({store, data}) => {
      store.data = proxyMap(data)
    },
  })
  .mobx({make: () => ({store: obs(observable.object({})), data: fill()})})
  .run()
