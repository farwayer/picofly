import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let s, key, i
let test = () => {
  s[key] = i
}
let beforeAll = () => i = 0

await bench(
  'Set number value to object',
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = create({}, obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = proxy({})
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = observable.object({})
    },
  })

  .run()
