import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let s, key, i
let test = () => s[key]
let beforeAll = () => i = 0

await bench(
  'Get object value from object again',
  ['valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = create({[key]: i}, obj)
      s[key]
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = proxy({[key]: i})
      s[key]
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      key = (++i).toString()
      s = observable.object({[key]: i})
      s[key]
    },
  })

  .run()
