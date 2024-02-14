import {proxyMap} from 'valtio/utils'
import {observable} from 'mobx'
import {create, map} from 'picofly'
import {bench} from '../utils.js'


await bench(
  'Create with empty Map',
  ['valtioMap', 'mobxMap'],
)
  .picofly(() => {
    create(new Map(), map)
  })

  .valtio(() => {
    proxyMap()
  })

  .mobx(() => {
    observable.map()
  })

  .run()
