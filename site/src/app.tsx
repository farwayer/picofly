import {useEffect, useMemo} from 'preact/hooks'
import {Picofly} from 'picofly/react'
import {createStore} from '~/store'
import {init} from '~/store/router'
import UI from '~/ui'

export default function App() {
  let app = useMemo(createStore, [])

  useEffect(() => init(app), [])

  return (
    <Picofly value={app}>
      <UI/>
    </Picofly>
  )
}
