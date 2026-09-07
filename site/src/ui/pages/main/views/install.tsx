import {select} from 'picofly/react'
import type App from '~/store/state'
import {copy} from '~/store/actions'

type Props = {
  cmd: string
  copied: boolean
  onCopy: () => void
}

export default select(
  (app: App, props: {cmd: string}) => ({
    copied: app.ui.copied === props.cmd,
    onCopy: () => void copy(app, props.cmd),
  }),
)(Install)

function Install({cmd, copied, onCopy}: Props) {
  return (
    <button class="install" onClick={onCopy}>
      <code>{cmd}</code>
      <span class="hint">{copied ? 'copied' : 'copy'}</span>
    </button>
  )
}
