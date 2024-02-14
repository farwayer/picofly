import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let m, i
let test = () => {
  m.set(i, {i})
}
let beforeAll = () => i = 0

await bench(
  'Set object value to Map',
  'valtioMap',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      m = create(new Map(), map)
      i++
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      m = proxyMap()
      i++
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      m = observable.map()
      i++
    },
  })

  .run()
