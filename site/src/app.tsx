import {useEffect, useRef} from 'preact/hooks'
import {Picofly} from 'picofly/react'
import {createStore, type App} from '~/store'
import {init} from '~/store/router'
import UI from '~/ui'

export default function () {
  let app = useRef<App>(null).current ??= createStore()

  useEffect(() => init(app), [])

  return (
    <Picofly value={app}>
      <UI/>
    </Picofly>
  )
}
