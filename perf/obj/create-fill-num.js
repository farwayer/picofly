import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let o
let beforeEach = () => {
  o = {}
  for (let i = 0; i < 100; i++) {
    o[i] = i
  }
}

await bench(
  'Create with object filled with 100 numbers',
  'create',
)
  .picofly(() => {
    create(o, obj)
  }, {beforeEach})

  .valtio(() => {
    proxy(o)
  }, {beforeEach})

  .mobx(() => {
    observable.object(o)
  }, {beforeEach})

  .run()
