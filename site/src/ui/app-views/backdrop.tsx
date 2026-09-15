import {select} from 'picofly/react'
import {callback} from 'picofly/react/selectors'
import type {App} from '~/store/state.ts'
import {closeMenu} from '~/store/actions.ts'

type Props = {
  open: boolean
  onClose: () => void
}

export default select(
  (app: App) => ({open: app.ui.menu}),
  callback('onClose', closeMenu),
)(Backdrop)

function Backdrop({open, onClose}: Props) {
  return open ? <div class="backdrop" onClick={onClose}/> : null
}
