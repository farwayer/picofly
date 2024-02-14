import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let s, key, i
let test = () => s[key].x.y.z
let beforeAll = () => i = 0

await bench(
  'Get object value from object',
  ['firstRead', 'valtioNoGet'],
)
  .picofly(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = create({[key]: {x: {y: {z: 0}}}}, obj)
    },
  })

  .valtio(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = proxy({[key]: {x: {y: {z: 0}}}})
    },
  })

  .mobx(test, {
    beforeAll,
    beforeEach() {
      key = i.toString()
      s = observable.object({[key]: {x: {y: {z: 0}}}})
    },
  })

  .run()
