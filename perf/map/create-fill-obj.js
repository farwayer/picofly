import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'

let arr, m
let beforeAll = () => {
  arr = []
  for (let i = 0; i < 100; i++) {
    arr.push([i, {i}])
  }
}
let beforeEach = () => {
  m = new Map(arr)
}

await bench(
  'Create with Map filled with 100 objects',
  'valtioMap'
)
  .picofly(() => {
    create(m, map)
  }, {beforeAll, beforeEach})

  .valtio(() => {
    proxyMap(arr)
  }, {beforeAll, beforeEach})

  .mobx(() => {
    observable.map(m)
  }, beforeAll, beforeEach)

  .run()
