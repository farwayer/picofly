import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let m
let test = () => {
  m.set(0, 0)
}

await bench(
  'Set number to Map',
  'valtioMap',
)
  .picofly(test, {
    beforeEach() {
      m = create(new Map(), map)
    },
  })

  .valtio(test, {
    beforeEach() {
      m = proxyMap()
    },
  })

  .mobx(test, {
    beforeEach() {
      m = observable.map()
    },
  })

  .run()
