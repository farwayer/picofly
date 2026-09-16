// type tests for the standard selectors
// run: yarn types

import {select} from '../src/react'
import {spec, item} from '../src/selectors.js'
import {callback, effect} from '../src/react/selectors.js'

type Video = {name: string, watched: boolean}
type App = {
  count: number
  user: {name: string}
  videos: Map<string, Video>
}

let watch = (app: App, id: string) => {
  app.videos.get(id)!.watched = true
}

// 1. spec merges selectors and infers app/props from them
let byCount = (app: App) => app.count
let byId = (app: App, props: {id: string}) => app.videos.get(props.id)

let s1 = spec({count: byCount, video: byId})
let v1: {count: number, video: Video | undefined} = s1(
  {} as App,
  {id: '1'},
)

// 2. spec takes dot paths too
let s2 = spec({count: byCount, name: 'user.name'})
let v2: {count: number, name: string} = s2({} as App, {})

// 3. item picks from a Map by props.id, prop is always present
let s3 = item<App, 'video'>('video')
let v3: {video: Video | undefined} = s3({} as App, {id: '1'})

// 4. callback attaches a named handler
let s4 = callback('onWatch', (app: App, id: string) => watch(app, id))
let v4: {onWatch: (id: string) => void} = s4({} as App, {})

// 5. effect returns void, so select() drops it from the props
let s5 = effect<App, {id: string}>({
  run: (app, props) => watch(app, props.id),
  deps: (app, props) => [props.id],
})
let v5: void = s5({} as App, {id: '1'})

// 6. all of them compose in select()
let Video = (props: {video?: Video, onWatch: (id: string) => void}) => null
let R6 = select(
  item<App, 'video'>('video'),
  callback('onWatch', (app: App, id: string) => watch(app, id)),
  effect<App, {id: string}>({run: (app, props) => watch(app, props.id)}),
)(Video)
let r6 = <R6 id="1"/>

// 7. spec output feeds a component
let R7 = select(spec({count: byCount}))((props: {count: number}) => null)
let r7 = <R7/>

// 8. item without an explicit App still fits the component
let Watched = (props: {id: string, video?: Video}) => null
let R8 = select(item('video'))(Watched)
let r8 = <R8 id="1"/>
