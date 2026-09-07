import {select} from 'picofly/react'
import type App from '~/store/state'
import type {Page} from '~/store/state'
import Header from './app-views/header'
import Footer from './app-views/footer'
import Main from './pages/main'
import Why from './pages/why'
import Architecture from './pages/arch'
import Selectors from './pages/selectors'
import Api from './pages/api'
import Perf from './pages/perf'
import './styles.css'

export default select(
  (app: App) => ({page: app.ui.page}),
)(UI)

let Pages = {
  main: Main,
  why: Why,
  architecture: Architecture,
  'hook-vs-selectors': Selectors,
  api: Api,
  performance: Perf,
}

function UI({page}: {page: Page}) {
  let Body = Pages[page]

  return (
    <>
      <Header/>

      <main>
        <Body/>
        <Footer/>
      </main>
    </>
  )
}
