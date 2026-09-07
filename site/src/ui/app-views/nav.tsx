import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import type App from '~/store/state'
import type {Page} from '~/store/state'
import {Pages} from '~/const'
import {closeMenu} from '~/store/actions'
import {path} from '~/store/router'
import {cn} from '~/lib/cn'

type Props = {
  current: Page
  open: boolean
  onLeave: () => void
}

export default select(
  (app: App) => ({
    current: app.ui.page,
    open: app.ui.menu,
  }),
  callback('onLeave', closeMenu),
)(Nav)

function Nav({current, open, onLeave}: Props) {
  return (
    <nav class={cn('nav', open && 'open')} onClick={onLeave}>
      {Pages.map(({id, name}) => id === current
        ? <span key={id} class="active">{name}</span>
        : <a key={id} href={path(id)}>{name}</a>
      )}
    </nav>
  )
}
