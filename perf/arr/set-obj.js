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
      arr = create([{}], obj)
      i++
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      arr = proxy([{}])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      arr = observable.array([{}])
    },
  })

  .run()
