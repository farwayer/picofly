import {proxy} from 'valtio'
import {observable} from 'mobx'
import {create, obj} from 'picofly'
import {bench} from '../utils.js'


await bench(
  'Create with empty array',
)
  .picofly(() => {
    create([], obj)
  })

  .valtio(() => {
    proxy([])
  })

  .mobx(() => {
    observable.array([])
  })

  .run()
