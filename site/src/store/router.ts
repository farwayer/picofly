import type {App, Page} from './state.ts'
import {Api, Engines, Pages} from '~/const.ts'

export let page = (pathname = location.pathname): Page => {
  let id = pathname.slice(1) as Page
  return Pages.some(p => p.id === id) ? id : 'main'
}

export let path = (id: Page) => id === 'main' ? '/' : `/${id}`

export let anchor = (sign: string) => sign.split('(')[0]

// the browser cross-fades the old page into the new one where it can. Preact
// renders in a microtask, so the callback waits for one before giving the
// transition its new state
let swap = (change: () => void) => {
  if (!document.startViewTransition) return change()

  document.startViewTransition(async () => {
    change()
    await null
  })
}

let go = (app: App, id: Page, hash: string) => {
  if (id === app.ui.page && !hash) return

  history.pushState(null, '', path(id) + hash)

  swap(() => {
    app.ui.page = id
    app.ui.menu = false
    hash ? jump(app) : scrollTo({top: 0, behavior: 'instant'})
  })
}

let jump = (app: App) => {
  let id = location.hash.slice(1)
  if (!id) return

  let tab = Api.find(({items}) => items.some(([sign]) => anchor(sign) === id))
  if (tab) app.ui.apiTab = tab.id

  let engine = Engines.find(e => e.id === id)
  if (engine) app.ui.engine = engine.id

  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView()
  })
}

export let init = (app: App) => {
  addEventListener('popstate', () => {
    swap(() => {
      app.ui.page = page()
      location.hash ? jump(app) : scrollTo({top: 0, behavior: 'instant'})
    })
  })

  addEventListener('hashchange', () => jump(app))

  addEventListener('click', e => {
    if (e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    let a = (e.target as Element).closest?.<HTMLAnchorElement>('a')
    if (!a || a.target || a.origin !== location.origin) return
    // same page: the browser jumps to the anchor itself
    if (a.hash && a.pathname === location.pathname) return

    e.preventDefault()
    go(app, page(a.pathname), a.hash)
  })

  jump(app)
}
