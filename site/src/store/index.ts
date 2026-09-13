import {store, obj} from 'picofly'
import {App} from './state'
import {page} from './router'

export {App} from './state'

export let createStore = () => {
  let app = store(new App(), [obj])
  app.ui.page = page()
  return app
}
