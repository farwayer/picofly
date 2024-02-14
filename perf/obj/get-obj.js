import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let s, key, i
let test = () => s[key]
let beforeAll = () => i = 0

await bench(
  'First get object value from object',
  ['firstRead', 'valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = create({[key]: {}}, obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = proxy({[key]: {}})
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = observable.object({[key]: {}})
    },
  })

  .run()
