# Picofly

_Lightweight proxy-based state manager, simple, fast and built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.webp" height="192" align="right">

⚡ **Fast**: hand-crafted and optimized to be as fast as possible  
🤏 **Tiny**: *514 bytes* in minimal config, *706 bytes* with React support  
🥧 **Simple**: *~140 lines* of sparse code + *~70 lines* for React support  
🍳 **Easy to use**: just modify data, magic will take care of the rest!  
⚛️ **React & React Native**: *hooks* and *selectors*, uses modern React 18 API  
🔋 **Charged**: *Map* support (*Set* in plans), *TypeScript* defs and more  
🪟 **Transparent**: original objects are not modified

## Why the hell another one?!

## How to use

### React example

#### store.js
```javascript
import {create, objMapIgnoreSpecialsRef, ref} from 'picofly'

// may be not a class but a simple object
class State {
  api = null
  authToken = null
  videos = new Map()

  get signedIn() {
    return !!this.authToken
  }
}

export let createStore = () => {
  let state = new State()
  
  // see proxifiers section for options
  let app = create(state, objMapIgnoreSpecialsRef)
  
  // ref will prevent proxifing the api
  app.api = ref(app, createApi())
  
  return app
}
```

#### app.js
```javascript
import {StoreProvider} from 'picofly/react'
import {createStore} from './store'
import VideoList from './video-list'

let app = createStore()

let App = () => {
  return (
    <StoreProvider value={app}>
      <VideoList/>
    </StoreProvider>
  )
}
```

#### video-list.js
```javascript
// use with hook

import {memo} from 'react'
import {useStore} from 'picofly/react'
import Video from './video'

export default memo(VideoList)

// will be re-rendered only when video added or removed
function VideoList() {
  let app = useStore()

  let ids = Array.from(app.videos.keys())
  let videos = ids.map(id => <Video id={id} key={id}/>)
  
  let addVideo = useCallback(() => {
    app.videos.set(Math.random(), {name: 'Cool video', watched: false})  
  })
  
  return (
    <div>
      {videos}
      <button onClick={addVideo}>ADD</button>
    </div>
  )
}
```

#### video.js
```javascript
// use with selectors

import {useCallback} from 'react'
import {select} from 'picofly/react'

// normally is in business logic
let watchVideo = async (app, id) => {
  await app.api.watchVideo(id)

  let video = app.videos.get(id)
  video.watched = true
}

// selector
let video = (app, props) => ({
  video: app.videos.get(props.id),
})

// combine selectors and attach to component
// all props returned from selectors will be merged and passed to component
export default select(
  video,
  (app, props) => ({
    // selectors are called in render context so you can use any hooks inside
    onWatched: useCallback(() => watchVideo(app, props.id), [props.id]),
  }),
)(Video)

// will be re-rendered only if the video name changed
function Video({
  video = {},
  onWatched,
}) {
  return (
    <div>
      <span>{video.name}</span>
      <button onClick={onWatched}>WATCH</button>
    </div>
  )
}
```
