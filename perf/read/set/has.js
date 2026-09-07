import {proxySet} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 numbers
//   let store = create(new Set([0, 1, ...]))
//
//   // bench
//   store.has(50)

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push(i)
  }

  return e
}

loop('Has number in Set with 100 numbers')
  .all({run: s => s.has(50)})
  .picofly({make: () => track(create(new Set(fill())))})
  .valtio({make: () => snap(proxySet(fill()))})
  .mobx({make: () => observable.set(new Set(fill())), enter: derived})
  .run()
