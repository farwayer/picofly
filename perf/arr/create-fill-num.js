import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


let arr
let beforeEach = () => {
  arr = []
  for (let i = 0; i < 100; i++) {
    arr.push(i)
  }
}

await bench(
  'Create with array filled with 100 numbers',
  'create',
)
  .picofly(() => {
    create(arr, obj)
  }, {beforeEach})

  .valtio(() => {
    proxy(arr)
  }, {beforeEach})

  .mobx(() => {
    observable.array(arr)
  }, {beforeEach})
  .run()
