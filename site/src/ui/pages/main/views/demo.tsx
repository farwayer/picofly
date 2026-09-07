import type {ComponentChildren} from 'preact'
import {useRef} from 'preact/hooks'
import {select, useStore} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import type App from '~/store/state'
import type {Key} from '~/store/state'
import {inc, reset} from '~/store/actions'
import {cn} from '~/lib/cn'

type ButtonProps = {
  onClick: () => void
  busy?: boolean
  class?: string
  children: ComponentChildren
}

export default function Demo() {
  return (
    <section class="demo">
      <h2>Just write beautiful code</h2>
      <p class="text">
        Picofly takes care of the rest
      </p>

      <div class="cells">
        <CellA reads="app.a"/>
        <CellB reads="app.b"/>
        <CellSum/>
      </div>

      <div class="buttons">
        <IncA/>
        <IncB/>
        <Reset class="ghost"/>
      </div>
    </section>
  )
}

let value = (key: Key) =>
  (app: App) => ({value: app.demo[key]})

let CellA = select(value('a'))(Cell)
let CellB = select(value('b'))(Cell)

let CellSum = () => {
  let app = useStore<App>()

  return <Cell reads="app.a + app.b" value={app.demo.a + app.demo.b}/>
}

function Cell({reads, value}: {reads: string, value: number}) {
  let renders = useRef(0)
  renders.current++

  return (
    <div class="cell">
      <code>{reads}</code>
      <span class="value" key={renders.current}>{value}</span>
      <span class="renders">renders: {renders.current}</span>
    </div>
  )
}

let incBtn = (key: Key) => select(
  (app: App) => ({
    onClick: () => inc(app, key),
    children: `${key}++`,
  }),
)(Button)

let IncA = incBtn('a')
let IncB = incBtn('b')

let Reset = select(
  (app: App) => ({
    busy: app.demo.resetting,
    children: 'reset',
  }),
  callback('onClick', reset),
)(Button)

function Button({onClick, busy, class: cls, children}: ButtonProps) {
  return (
    <button class={cls} onClick={onClick} disabled={busy}>
      <span class={cn(busy && 'off')}>{children}</span>
      {busy && <span class="spin"/>}
    </button>
  )
}
