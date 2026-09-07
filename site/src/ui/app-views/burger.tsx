import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import type App from '~/store/state'
import {toggleMenu} from '~/store/actions'
import {Close, Menu} from '~/ui/views/icons'

type Props = {
  open: boolean
  onToggle: () => void
}

export default select(
  (app: App) => ({open: app.ui.menu}),
  callback('onToggle', toggleMenu),
)(Burger)

function Burger({open, onToggle}: Props) {
  return (
    <button
      class="burger"
      aria-label="Menu"
      aria-expanded={open}
      onClick={onToggle}
    >
      {open ? <Close/> : <Menu/>}
    </button>
  )
}
