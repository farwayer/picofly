import {proxySet} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 numbers
//   let store = create(new Set([0, 1, ...]))
//
//   // bench
//   store.size

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push(i)
  }

  return new Set(e)
}

loop('Read size of Set with 100 numbers')
  .all({run: s => s.size})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxySet(fill()))})
  .mobx({make: () => observable.set(fill()), enter: derived})
  .run()
