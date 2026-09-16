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
  // the page you are on: its link in the header takes you back to the top
  if (id === app.ui.page && !hash) {
    app.ui.menu = false
    scrollTo({top: 0})
    return
  }

  history.pushState(null, '', path(id) + hash)

  swap(() => {
    app.ui.page = id
    app.ui.menu = false
    hash ? jump(app, true) : scrollTo({top: 0, behavior: 'instant'})
  })
}

// `nav` is a page change: a hash that points at nothing, like the engine of a
// benchmark tab, still has to land at the top of the new page
let jump = (app: App, nav = false) => {
  let id = location.hash.slice(1)
  if (!id) return

  let tab = Api.find(({items}) => items.some(([sign]) => anchor(sign) === id))
  if (tab) app.ui.apiTab = tab.id

  let engine = Engines.find(e => e.id === id)
  if (engine) app.ui.engine = engine.id

  requestAnimationFrame(() => {
    let el = document.getElementById(id)

    if (el) {
      el.scrollIntoView()
    } else if (nav) {
      scrollTo({top: 0, behavior: 'instant'})
    }
  })
}

export let init = (app: App) => {
  // a fragment navigation is a history entry too, so clicking a tab lands
  // here as well as in `hashchange`. It is not a page change: nothing to
  // cross-fade, and `jump` must not take it for a landing on a new page
  addEventListener('popstate', () => {
    let id = page()
    if (id === app.ui.page) return jump(app)

    swap(() => {
      app.ui.page = id
      location.hash ? jump(app, true) : scrollTo({top: 0, behavior: 'instant'})
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
