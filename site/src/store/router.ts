import type App from './state'
import type {Page} from './state'
import {Api, Pages} from '~/const'

export let page = (pathname = location.pathname): Page => {
  let id = pathname.slice(1) as Page
  return Pages.some(p => p.id === id) ? id : 'main'
}

export let path = (id: Page) => id === 'main' ? '/' : `/${id}`

export let anchor = (sign: string) => sign.split('(')[0]

let go = (app: App, id: Page, hash: string) => {
  if (id === app.ui.page && !hash) return

  history.pushState(null, '', path(id) + hash)
  app.ui.page = id
  app.ui.menu = false
  hash ? jump(app) : scrollTo(0, 0)
}

let jump = (app: App) => {
  let id = location.hash.slice(1)
  if (!id) return

  let tab = Api.find(({items}) => items.some(([sign]) => anchor(sign) === id))
  if (tab) app.ui.apiTab = tab.id

  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView()
  })
}

export let init = (app: App) => {
  addEventListener('popstate', () => {
    app.ui.page = page()
    location.hash ? jump(app) : scrollTo(0, 0)
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
