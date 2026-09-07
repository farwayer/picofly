import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 numbers
//   let data = {0: 0, 1: 1, ...}
//
//   // bench
//   store.data = data

// the backend answered and the whole thing goes into a store prop
let fill = () => {
  let o = {}

  for (let i = 0; i < 100; i++) {
    o[i] = i
  }

  return o
}

let put = ({store, data}) => {
  store.data = data
}

loop('Put object of 100 numbers into a store prop')
  .all({fresh: true, n: 200, repeats: 8, run: put})
  .picofly({make: () => ({store: watch(create({})), data: fill()})})
  .valtio({make: () => ({store: sub(proxy({})), data: fill()})})
  .mobx({make: () => ({store: obs(observable.object({})), data: fill()})})
  .run()
