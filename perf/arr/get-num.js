import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr, i
let test = () => arr[0]
let beforeAll = () => i = 0

await bench(
  'Get number value from array',
  'valtioNoGet'
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      arr = create([i++], obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      arr = proxy([i++])
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      arr = observable.array([i++])
    },
  })

  .run()
