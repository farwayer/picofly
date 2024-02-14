import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


let arr, s
let test = () => {
  s.clear()
}
let beforeAll = () => {
  arr = []
  for (let i = 0; i < 100; i++) {
    arr.push([{i}, i])
  }
}

await bench(
  'Clear Map with object keys and 100 numbers',
  ['valtioMap', 'mobxMap'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      let m = new Map(arr)
      s = create(m, map)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      s = proxyMap(arr)
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      let m = new Map(arr)
      s = observable.map(m)
    },
  })

  .run()
