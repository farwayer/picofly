import {select} from 'picofly/react'
import type App from '~/store/state'
import type {ApiTab} from '~/store/state'
import {setApiTab} from '~/store/actions'
import {anchor} from '~/store/router'
import {Api, OwnRule, Rules, RulesPick} from '~/const'
import {cn} from '~/lib/cn'
import {hl} from '~/lib/hl'
import {md} from '~/lib/md'
import Tabs from '~/ui/views/tabs'

type Props = {
  tab: ApiTab
  onTab: (tab: ApiTab) => void
}

export default select(
  (app: App) => ({
    tab: app.ui.apiTab,
    onTab: (tab: ApiTab) => setApiTab(app, tab),
  }),
)(ApiPage)

function ApiPage({tab, onTab}: Props) {
  let current = Api.find(({id}) => id === tab) ?? Api[0]

  return (
    <section class="page">
      <h1>API</h1>
      <p class="text">
        The core, the React wrapper and ready-made selectors for both.
      </p>

      <Tabs items={Api} current={current.id} onTab={onTab}/>

      <List items={current.items}/>

      {current.id === 'core' && (
        <>
          <h2 id="rules">Rules</h2>
          <p class="text">
            A rule decides what gets a proxy. Fewer rules ship fewer bytes
            and do less on every read.
          </p>

          <pre>{hl(RulesPick)}</pre>

          <RuleList/>

          <h3 id="own-rule">Your own rule</h3>
          <p class="text">
            A rule decides what to do with a value: proxy it or pass it on.
            Rules have priorities and run one after another by those
            priorities. A rule called without the <code>next</code> parameter
            must return its own priority. The <code>next</code> parameter is
            the next rule in the chain, <code>$</code> is the store internal
            state and <code>val</code> is the value to proxy.
          </p>

          <pre>{hl(OwnRule)}</pre>
        </>
      )}
    </section>
  )
}

function RuleList() {
  return (
    <ul class="api">
      {Rules.map(([name, priority, text]) => (
        <li key={name} id={name}>
          <div class="sign">
            <a href={`#${name}`}><code>{name}</code></a>
            <em>priority: {priority}</em>
          </div>
          <span>{md(text)}</span>
        </li>
      ))}
    </ul>
  )
}

function List({items}: {items: [string, string, string?][]}) {
  return (
    <ul class="api">
      {items.map(([sign, text, example]) => {
        let id = anchor(sign)

        return (
          <li key={id} id={id}>
            <a href={`#${id}`}><code>{sign}</code></a>
            {text.split(/\n\s*\n/).map((part, i) => (
              <span key={part} class={cn(i && 'detail')}>{md(part)}</span>
            ))}
            {example && (
              <details>
                <summary>example</summary>
                <pre>{hl(example)}</pre>
              </details>
            )}
          </li>
        )
      })}
    </ul>
  )
}
