import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 entries
//   let store = create(new Map([[0, 0], ...]))
//
//   // bench
//   store.delete(1)

let fill = () => {
  let e = []

  for (let i = 0; i < 100; i++) {
    e.push([i, i])
  }

  return new Map(e)
}

loop('Delete number key from Map')
  .all({fresh: true, run: (m, i) => m.delete(i % 100)})
  .picofly({make: () => watch(create(fill()))})
  .valtio({make: () => sub(proxyMap(fill()))})
  .mobx({make: () => obs(observable.map(fill()))})
  .run()
