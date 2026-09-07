import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create(new Map())
//
//   // bench
//   store.set(1, 1)

loop('Set number to Map')
  .all({fresh: true, run: (m, i) => m.set(i, i)})
  .picofly({make: () => watch(create(new Map()))})
  .valtio({make: () => sub(proxyMap())})
  .mobx({make: () => obs(observable.map())})
  .run()
