import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => arr[i]
let beforeAll = () => i = 0

await bench(
  'Get object value from array again',
  ['valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = create([{[i]: i}], obj)
      arr[i]
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = proxy([{[i]: i}])
      arr[i]
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = observable.array([{[i]: i}])
      arr[i]
    }
  })

  .run()
