import {select} from 'picofly/react'
import type App from '~/store/state'
import type {TabId} from '~/store/state'
import {setTab} from '~/store/actions'
import {Tabs as items} from '~/const'
import {cn} from '~/lib/cn'
import {hl} from '~/lib/hl'
import Tabs from '~/ui/views/tabs'

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
