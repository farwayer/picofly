import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, {i: 0}], ...]))
//
//   // bench
//   store.clear()

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, {i}])
  }

  return new Map(e)
}

loop('Clear Map with number keys and 100 objects')
  .all({fresh: true, n: 2000, run: m => m.clear()})
  .picofly({make: () => watch(create(fill()))})
  .valtio({make: () => sub(proxyMap(fill()))})
  .mobx({make: () => obs(observable.map(fill()))})
  .run()
