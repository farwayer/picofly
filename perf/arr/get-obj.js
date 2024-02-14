import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => arr[i]
let beforeAll = () => i = 0

await bench(
  'First get object value from array',
  ['firstRead', 'valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = create([{[i]: i}], obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = proxy([{[i]: i}])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = observable.array([{[i]: i}])
    }
  })

  .run()
