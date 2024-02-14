import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr
let test = () => {
  arr[0] = 1
}

await bench(
  'Set number to array',
)
  .picofly(test, {
    beforeEach() {
      arr = create([0], obj)
    },
  })

  .valtio(test, {
    beforeEach() {
      arr = proxy([0])
    },
  })

  .mobx(test, {
    beforeEach() {
      arr = observable.array([0])
    },
  })

  .run()
