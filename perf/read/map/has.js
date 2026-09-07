import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, track, snap, derived} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, 0], ...]))
//
//   // bench
//   store.has(50)

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, i])
  }

  return e
}

loop('Has number key in Map with 100 entries')
  .all({run: m => m.has(50)})
  .picofly({make: () => track(create(new Map(fill())))})
  .valtio({make: () => snap(proxyMap(fill()))})
  .mobx({make: () => observable.map(new Map(fill())), enter: derived})
  .run()
