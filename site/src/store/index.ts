import {create} from 'picofly'
import App from './state'
import {page} from './router'

export let createStore = () => {
  let app = create(new App())
  app.ui.page = page()
  return app
}
