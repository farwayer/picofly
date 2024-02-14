import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let m, i
let test = () => m.get(i)
let beforeAll = () => i = 0

await bench(
  'First get object value from Map',
  'valtioMap',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = create(new Map([[i, {i}]]), map)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = proxyMap([[i, {i}]])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      m = observable.map(new Map([[i, i]]))
    },
  })

  .run()
