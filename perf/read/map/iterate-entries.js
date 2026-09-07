import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, 0], ...]))
//
//   // bench
//   for (let [k, v] of store) sum += k + v

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, i])
  }

  return new Map(e)
}

let sum = m => {
  let n = 0

  for (let [k, v] of m) n += k + v

  return n
}

loop('Iterate Map entries, 100 numbers')
  .all({run: sum})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxyMap(fill()))})
  .mobx({make: () => observable.map(fill()), enter: derived})
  .run()
