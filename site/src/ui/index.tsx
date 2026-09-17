import {select} from 'picofly/react'
import type {App, Page} from '~/store/state.ts'
import Header from './app-views/header.tsx'
import Footer from './app-views/footer.tsx'
import Main from './pages/main/index.tsx'
import Why from './pages/why/index.tsx'
import Architecture from './pages/arch/index.tsx'
import Selectors from './pages/selectors/index.tsx'
import Api from './pages/api/index.tsx'
import Perf from './pages/perf/index.tsx'
import Tips from './pages/tips/index.tsx'
import './styles.css'

export default select(
  (app: App) => ({page: app.ui.page}),
)(UI)

let Pages = {
  main: Main,
  why: Why,
  arch: Architecture,
  'hook-vs-selectors': Selectors,
  api: Api,
  perf: Perf,
  tips: Tips,
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
