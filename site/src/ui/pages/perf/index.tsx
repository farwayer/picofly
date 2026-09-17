import {Fragment} from 'preact'
import {useEffect, useRef, useState} from 'preact/hooks'
import {select} from 'picofly/react'
import {BenchCode} from 'virtual:bench-code'
import type {App, EngineId} from '~/store/state.ts'
import {Caveats, Cfg, Engines, Libs, Notes, ReactCaveats, Verdict} from '~/const.ts'
import {cn} from '~/lib/cn.ts'
import {hl} from '~/lib/hl.tsx'
import {md} from '~/lib/md.tsx'
import {ArrowRight, ArrowUp} from '~/ui/views/icons.tsx'
import Points from '~/ui/views/points.tsx'
import Tabs from '~/ui/views/tabs.tsx'

type Props = {
  engine: EngineId
}

export default select(
  (app: App) => ({engine: app.ui.engine}),
)(Perf)

function Perf({engine}: Props) {
  let [open, setOpen] = useState('')
  let measured = Engines.filter(({bench}) => bench.length)
  let current = measured.find(({id}) => id === engine) ?? measured[0]

  let libs = current.libs ?? Libs
  let cols = libs.length + 1
  let app = current.id === 'react'

  let scroll = useRef<HTMLDivElement>(null)
  let [more, setMore] = useState(false)

  // the arrow above the table stays while there is table beyond the right edge
  useEffect(() => {
    let box = scroll.current
    if (!box) return

    let check = () => {
      setMore(box.scrollWidth - box.clientWidth - box.scrollLeft > 1)
    }

    check()
    box.addEventListener('scroll', check, {passive: true})
    addEventListener('resize', check)

    return () => {
      box.removeEventListener('scroll', check)
      removeEventListener('resize', check)
    }
  }, [current.id])

  let scrollOn = () => {
    let box = scroll.current
    box?.scrollBy({left: box.clientWidth, behavior: 'smooth'})
  }

  // a footnote belongs to a row, so the other tabs never show it
  let shown = new Set(current.bench.flatMap(
    ([group, items]) => items.map(([name]) => `${group}/${name}`),
  ))
  let notes = Notes.filter(([ids]) => ids.some(id => shown.has(id)))

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
      <p class="text">
        Benchmarks, the runner and the raw results are in{' '}
        <a href={`${Cfg.links.github}/tree/main/perf`}>perf</a>.
      </p>

      {measured.length > 1 && (
        <Tabs items={measured} current={current.id} hash/>
      )}

      <p class={cn('text bench-env', more && 'goes-on')}>
        {current.env}, Linux, i9-13900, P-cores only
        <button class="scroll-on" onClick={scrollOn} aria-label="scroll the table">
          <ArrowRight/>
        </button>
      </p>

      <div class="scroll" ref={scroll}>
        <table class="bench" style={`--cols: ${cols}`}>
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
                let note = notes.findIndex(([ids]) => ids.includes(id)) + 1

                return (
                  <Fragment key={name}>
                    <tr id={`row-${id}`}>
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
                            {note > 0 && (
                              <a
                                class="note-ref"
                                href={`#note-${note}`}
                                // the summary would toggle the snippet open
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  jumpTo(`note-${note}`)
                                }}
                              >
                                <sup>{note}</sup>
                              </a>
                            )}
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

      {notes.map(([ids, text], i) => (
        <p class="text bench-note" key={i} id={`note-${i + 1}`}>
          <sup>{i + 1}</sup> {md(text)}
          <button
            class="up"
            aria-label="Back to the benchmark"
            onClick={() => jumpTo(`row-${ids[0]}`)}
          >
            <ArrowUp/>
          </button>
        </p>
      ))}

      <h2>Method</h2>
      {app ? (
        <p class="text">
          The same little app written five times over, once per library, and
          driven through a real renderer.
        </p>
      ) : (
        <p class="text">
          Each library is read and written the way its React binding does it,
          but without the binding itself — only the read and write noop
          subscribers of the core.
        </p>
      )}

      <Points items={app ? ReactCaveats : Caveats}/>
    </section>
  )
}

// the page scrolls itself: a real hash would leave a dead link in the url
let jumpTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({block: 'center'})

let ns = (v: string) =>
  parseFloat(v.replace(/,/g, ''))
