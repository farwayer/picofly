export type TabId =
  'store' | 'app' | 'hooks' | 'reset' | 'selectors' | 'inc'
export type Key = 'a' | 'b'
export type ApiTab = 'core' | 'selectors' | 'react' | 'react-selectors'
export type EngineId = 'v8' | 'jsc' | 'sm'
export type Page = 'main' | 'why' | 'architecture' | 'hook-vs-selectors' | 'api' | 'performance'

export class Demo {
  a = 0
  b = 0
  resetting = false
}

export class Ui {
  page: Page = 'main'
  tab: TabId = 'store'
  apiTab: ApiTab = 'core'
  engine: EngineId = 'v8'
  copied = ''
  menu = false
}

export default class App {
  ui = new Ui()
  demo = new Demo()
}
