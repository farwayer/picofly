import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   // 100 components read it
//   let store = create({})
//
//   // bench
//   store.x = 1

// every write walks the subscriber list, so the count is part of the price
let SUBS = 100

loop('Set number to object with 100 subscribers')
  .all({
    fresh: true,
    run: (s, i) => {
      s.x = i
    },
  })
  .picofly({make: () => watch(create({}), SUBS)})
  .valtio({make: () => sub(proxy({}), SUBS)})
  .mobx({make: () => obs(observable.object({}), SUBS)})
  .run()
