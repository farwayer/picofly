import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let m, i
let test = () => {
  m.set(i, i)
}
let beforeAll = () => i = 0

await bench(
  'Set number to Map',
  'valtioMap',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = create(new Map(), map)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = proxyMap()
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = observable.map()
    },
  })

  .run()
