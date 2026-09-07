import {proxySet} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 objects
//   let store = create(new Set([{i: 0}, ...]))
//
//   // bench
//   for (let v of store) sum += v.i

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push({i})
  }

  return new Set(e)
}

let sum = s => {
  let n = 0

  for (let v of s) n += v.i

  return n
}

loop('Iterate Set with 100 objects, cold')
  .all({fresh: true, n: 50, repeats: 30, warm: 100, run: sum})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxySet(fill()))})
  .mobx({make: () => observable.set(fill()), enter: derived})
  .run()
