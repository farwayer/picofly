import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, 0], ...]))
//
//   // bench
//   store.size

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, i])
  }

  return new Map(e)
}

loop('Read size of Map with 100 numbers')
  .all({run: m => m.size})
  .picofly({make: () => track(create(fill()))})
  .valtio({make: () => snap(proxyMap(fill()))})
  .mobx({make: () => observable.map(fill()), enter: derived})
  .run()
