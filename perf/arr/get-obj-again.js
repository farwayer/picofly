import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => arr[0]
let beforeAll = () => i = 0

await bench(
  'Get object value from array again',
  ['valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      arr = create([{[i]: i++}], obj)
      arr[0]
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      arr = proxy([{[i]: i++}])
      arr[0]
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      arr = observable.array([{[i]: i++}])
      arr[0]
    }
  })

  .run()
