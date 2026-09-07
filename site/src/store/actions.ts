import type App from './state'
import type {ApiTab, EngineId, Key, TabId} from './state'

export let setTab = (app: App, tab: TabId) => {
  app.ui.tab = tab
}

export let setApiTab = (app: App, tab: ApiTab) => {
  app.ui.apiTab = tab
}

export let setEngine = (app: App, engine: EngineId) => {
  app.ui.engine = engine
}

export let toggleMenu = (app: App) => {
  app.ui.menu = !app.ui.menu
}

export let closeMenu = (app: App) => {
  app.ui.menu = false
}

export let inc = (app: App, key: Key) => {
  app.demo[key]++
}

export let reset = async (app: App) => {
  app.demo.resetting = true

  await new Promise(done => setTimeout(done, 500))

  app.demo.a = 0
  app.demo.b = 0
  app.demo.resetting = false
}

export let copy = async (app: App, text: string) => {
  try {
    await navigator.clipboard.writeText(text)
  }
  catch {
    return
  }

  app.ui.copied = text
  setTimeout(() => app.ui.copied = '', 1500)
}
