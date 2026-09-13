import {Fragment} from 'preact'
import {useState} from 'preact/hooks'
import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import {BenchCode} from 'virtual:bench-code'
import type App from '~/store/state'
import type {EngineId} from '~/store/state'
import {setEngine} from '~/store/actions'
import {Caveats, Engines, Libs, Notes, Verdict} from '~/const'
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

  let libs = Libs
  let cols = libs.length + 1

  return (
    <section class="page">
      <h1>Performance</h1>

      <h2>Summary</h2>
      <p class="text">
        How many times faster/slower picofly is on V8, median over the
        category.
      </p>
      <Points items={Verdict}/>

      <h2>All benchmarks</h2>
      {measured.length > 1 && (
        <Tabs items={measured} current={current.id} onTab={onEngine}/>
      )}

      <p class="text bench-env">{current.env}, Linux, i9-13900, P-cores only</p>

      <div class="scroll">
        <table class="bench">
          <colgroup>
            {Array.from({length: cols}, (_, i) => <col key={i}/>)}
          </colgroup>

          {current.bench.map(([group, rows]) => (
            <tbody key={group}>
              <tr>
                <th class="group">
                  {group}
                  <span class="unit">
                    ({current.renders && 'renders, '}{current.unit ?? 'ns'}/op)
                  </span>
                </th>
                {libs.map(([lib, version]) => (
                  <th key={lib}>
                    <span class="lib">
                      <span class="lib-ver">{version}</span>
                      {lib}
                    </span>
                  </th>
                ))}
              </tr>
              {rows.map(([name, ...run]) => {
                let all = run.map(ns)
                let best = Math.min(...all.filter(v => v === v))
                let id = `${group}/${name}`
                let code = BenchCode[id]
                let note = Notes.findIndex(([ids]) => ids.includes(id)) + 1

                return (
                  <Fragment key={name}>
                    <tr>
                      <td>
                        <details
                          open={open === id}
                          onToggle={e => {
                            let {open} = e.currentTarget as HTMLDetailsElement

                            // the one closing may be the previous row, losing
                            // the race with the one just opened
                            setOpen(was => open ? id : was === id ? '' : was)
                          }}
                        >
                          <summary>
                            {name}
                            {note > 0 && <sup>{note}</sup>}
                          </summary>
                        </details>
                      </td>
                      {run.map((v, i) => {
                        let [value, renders] = v.split(' (')

                        return (
                          <td
                            key={i}
                            class={cn(ns(v) === best && 'win')}
                          >
                            {renders && (
                              <span class="renders">
                                {renders.replace(')', '')}
                              </span>
                            )}
                            <span class="time">{value}</span>
                          </td>
                        )
                      })}
                    </tr>

                    {open === id && code && (
                      <tr class="snippet">
                        <td colSpan={cols}>
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

      {Notes.map(([, text], i) => (
        <p class="text bench-note" key={i}>
          <sup>{i + 1}</sup> {md(text)}
        </p>
      ))}

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
