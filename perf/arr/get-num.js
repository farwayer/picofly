import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => arr[i]
let beforeAll = () => i = 0

await bench(
  'Get number value from array',
  'valtioNoGet'
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = create([i], obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = proxy([i])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      ++i
      arr = observable.array([i])
    },
  })

  .run()
