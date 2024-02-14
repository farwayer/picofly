import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let s, key, i
let test = () => {
  s[key] = {x: {y: {z: 0}}}
}
let beforeAll = () => i = 0

await bench(
  'Set deep object value to object',
  'create'
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = create({}, obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = proxy({})
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = observable.object({})
    },
  })

  .run()