import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => {
  arr[0] = {i}
}
let beforeAll = () => i = 0

await bench(
  'Set object value to array',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = create([{}], obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = proxy([{}])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = observable.array([{}])
    },
  })

  .run()
