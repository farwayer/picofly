import {proxySet} from 'valtio/utils'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create(new Set())
//
//   // bench
//   store.add(1)

loop('Add number to Set')
  .all({fresh: true, run: (s, i) => s.add(i)})
  .picofly({make: () => watch(create(new Set()))})
  .valtio({make: () => sub(proxySet())})
  .mobx({make: () => obs(observable.set())})
  .run()
