import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, {i: 0}], ...]))
//   for (let v of store.values()) sum += v.i
//
//   // bench
//   for (let v of store.values()) sum += v.i

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, {i}])
  }

  return new Map(e)
}

let sum = m => {
  let n = 0

  for (let v of m.values()) n += v.i

  return n
}

loop('Iterate Map with 100 objects, cached')
  .all({run: sum})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxyMap(fill()))})
  .mobx({make: () => observable.map(fill()), enter: derived})
  .run()
