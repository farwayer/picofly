import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 objects
//   let data = [{i: 0}, ...]
//
//   // bench
//   store.data = data

// the backend answered and the whole thing goes into a store prop
let fill = () => {
  let a = []

  for (let i = 0; i < 100; i++) {
    a.push({i})
  }

  return a
}

let put = ({store, data}) => {
  store.data = data
}

loop('Put array of 100 objects into a store prop')
  .all({fresh: true, n: 200, repeats: 8, run: put})
  .picofly({make: () => ({store: watch(create({})), data: fill()})})
  .valtio({make: () => ({store: sub(proxy({})), data: fill()})})
  .mobx({make: () => ({store: obs(observable.object({})), data: fill()})})
  .run()
