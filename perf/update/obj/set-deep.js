import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create} from 'picofly'
import {loop, obs, sub, watch} from '../../utils.js'


// show:
//   let store = create({})
//
//   // bench
//   store.x = {x: {y: {z: 1}}}

loop('Set deep object value to object')
  .all({
    fresh: true,
    run: (s, i) => {
      s.x = {x: {y: {z: i}}}
    },
  })
  .picofly({make: () => watch(create({}))})
  .valtio({make: () => sub(proxy({}))})
  .mobx({make: () => obs(observable.object({}))})
  .run()
