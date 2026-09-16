import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import type {App, Page} from '~/store/state.ts'
import {Pages} from '~/const.ts'
import {closeMenu} from '~/store/actions.ts'
import {path} from '~/store/router.ts'
import {cn} from '~/lib/cn.ts'

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
      {Pages.map(({id, name}) => (
        <a key={id} href={path(id)} class={cn(id === current && 'active')}>
          {name}
        </a>
      ))}
    </nav>
  )
}
