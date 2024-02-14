import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr
let test = () => {
  arr.push(0)
}

await bench(
  'Push number to array',
)
  .picofly(test, {
    beforeEach() {
      arr = create([], obj)
    },
  })

  .valtio(test, {
    beforeEach() {
      arr = proxy([])
    },
  })

  .mobx(test, {
    beforeEach() {
      arr = observable.array([])
    },
  })

  .run()
