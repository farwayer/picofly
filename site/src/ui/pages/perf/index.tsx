import {Fragment} from 'preact'
import {useState} from 'preact/hooks'
import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import {BenchCode} from 'virtual:bench-code'
import type App from '~/store/state'
import type {EngineId} from '~/store/state'
import {setEngine} from '~/store/actions'
import {Caveats, Engines, Setup, Verdict} from '~/const'
import {cn} from '~/lib/cn'
import {hl} from '~/lib/hl'
import {md} from '~/lib/md'
import Points from '~/ui/views/points'
import Tabs from '~/ui/views/tabs'

type Props = {
  engine: EngineId
  onEngine: (engine: EngineId) => void
}

export default select(
  (app: App) => ({engine: app.ui.engine}),
  callback('onEngine', setEngine),
)(Perf)

function Perf({engine, onEngine}: Props) {
  let [open, setOpen] = useState('')
  let measured = Engines.filter(({bench}) => bench.length)
  let current = measured.find(({id}) => id === engine) ?? measured[0]

  return (
    <section class="page">
      <h1>Performance</h1>

      <div class="two-up">
        <Spec rows={Setup.slice(0, 3)}/>
        <Spec rows={Setup.slice(3)}/>
      </div>

      <h2>Summary</h2>
      <p class="text">
        How many times faster/slower picofly is on V8, median over the
        category.
      </p>
      <Points items={Verdict}/>

      <h2>All benchmarks</h2>
      <p class="text">
        Nanoseconds per operation, less is better. Green marks the fastest of
        the row.
      </p>

      {measured.length > 1 && (
        <Tabs items={measured} current={current.id} onTab={onEngine}/>
      )}

      <div class="scroll">
        <table class="bench">
          <colgroup>
            <col/>
            <col/>
            <col/>
            <col/>
          </colgroup>

          {current.bench.map(([group, rows]) => (
            <tbody key={group}>
              <tr>
                <th class="group" colSpan={4}>{group}</th>
              </tr>
              <tr>
                <th>bench</th>
                <th>picofly</th>
                <th>valtio</th>
                <th>mobx</th>
              </tr>
              {rows.map(([name, ...run]) => {
                let all = run.map(ns)
                let best = Math.min(...all)
                let id = `${group}/${name}`
                let code = BenchCode[id]

                return (
                  <Fragment key={name}>
                    <tr>
                      <td>
                        <details
                          open={open === id}
                          onToggle={e => setOpen(
                            (e.currentTarget as HTMLDetailsElement).open ? id : ''
                          )}
                        >
                          <summary>{name}</summary>
                        </details>
                      </td>
                      {all.map((v, i) => (
                        <td
                          key={i}
                          class={cn(v === best && 'win')}
                        >
                          {run[i]}
                        </td>
                      ))}
                    </tr>

                    {open === id && code && (
                      <tr class="snippet">
                        <td colSpan={4}>
                          <pre>{hl(code)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          ))}
        </table>
      </div>

      <h2>Method</h2>
      <p class="text">
        Each library is read and written the way its React binding does it,
        but without the binding itself — only the read and write noop
        subscribers of the core.
      </p>

      <Points items={Caveats}/>
    </section>
  )
}

let ns = (v: string) =>
  parseFloat(v.replace(/,/g, ''))

function Spec({rows}: {rows: [string, string][]}) {
  return (
    <dl class="spec">
      {rows.map(([key, value]) => (
        <Fragment key={key}>
          <dt>{key}</dt>
          <dd>{md(value)}</dd>
        </Fragment>
      ))}
    </dl>
  )
}
