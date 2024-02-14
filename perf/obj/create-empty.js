import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


await bench(
  'Create with empty object',
  'create',
)
  .picofly(() => {
    create({}, obj)
  })

  .valtio(() => {
    proxy({})
  })

  .mobx(() => {
    observable.object({})
  })

  .run()
