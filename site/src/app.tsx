import {useEffect, useRef} from 'preact/hooks'
import {Picofly} from 'picofly/react'
import {createStore, type App} from '~/store/index.ts'
import {init} from '~/store/router.ts'
import UI from '~/ui/index.tsx'

export default function () {
  let app = useRef<App>(null).current ??= createStore()

  useEffect(() => init(app), [])

  return (
    <Picofly value={app}>
      <UI/>
    </Picofly>
  )
}
