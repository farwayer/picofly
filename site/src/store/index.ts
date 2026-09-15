import {store, obj} from 'picofly'
import {App} from './state.ts'
import {page} from './router.ts'

export {App} from './state.ts'

export let createStore = () => {
  let app = store(new App(), [obj])
  app.ui.page = page()
  return app
}
