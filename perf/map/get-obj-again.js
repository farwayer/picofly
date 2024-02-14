import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let m, i
let test = () => m.get(i)
let beforeAll = () => i = 0

await bench(
  'Get object value from Map again',
  'valtioMap'
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      i++
      m = create(new Map([[i, {i}]]), map)
      m.get(i)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      i++
      m = proxyMap([[i, {i}]])
      m.get(i)
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      i++
      m = observable.map(new Map([[i, i]]))
      m.get(i)
    },
  })

  .run()
