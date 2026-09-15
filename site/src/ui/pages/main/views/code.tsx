import {select} from 'picofly/react'
import type {App, TabId} from '~/store/state.ts'
import {setTab} from '~/store/actions.ts'
import {Tabs as items} from '~/const.ts'
import {cn} from '~/lib/cn.ts'
import {hl} from '~/lib/hl.tsx'
import Tabs from '~/ui/views/tabs.tsx'

type Props = {
  tab: TabId
  onTab: (tab: TabId) => void
}

export default select(
  (app: App) => ({
    tab: app.ui.tab,
    onTab: (tab: TabId) => setTab(app, tab),
  }),
)(Code)

function Code({tab, onTab}: Props) {
  let current = items.find(({id}) => id === tab) ?? items[0]

  return (
    <section class="code">
      <p class="text">
        <a href="/hook-vs-selectors">Hook vs Selectors</a> →
      </p>

      <Tabs items={items} current={current.id} onTab={onTab}/>

      <div class="stack">
        {items.map(({id, code}) => (
          <pre key={id} class={cn(id !== current.id && 'off')}>
            {hl(code)}
          </pre>
        ))}
      </div>
    </section>
  )
}
