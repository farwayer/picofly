import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => {
  arr.push({i})
}
let beforeAll = () => i = 0

await bench(
  'Push object to array',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = create([], obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = proxy([])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = observable.array([])
    },
  })

  .run()
