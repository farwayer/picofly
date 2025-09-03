# Picofly

_Lightweight handy state manager, simple, fast and built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.webp" height="192" align="right">

⚡ **Fast**: optimized to be as fast as possible  
🤏 **Tiny**: *513 bytes* in minimal config, *704 bytes* with React support  
🥧 **Simple**: *~140 lines* of sparse code + *~70 lines* for React support  
🍳 **Handy**: you will worry about what needs to be done, not how  
⚛️ **React & React Native**: *hooks* or *selectors*, modern React API  
🔋 **Charged**: *Map* and *Set*, *TypeScript* support and more  
🪟 **Transparent**: original objects are not modified

## Why the hell another one?!

## How to use

In default configuration picofly proxies objects, arrays, Map, Set,
ignores special objects like Date, Error, RegExp etc. If you don't use
some of the this functionality, you can check out the Fine-tuning section
to slightly reduce the bundle size and get better performance.

### React example

Picofly can be used with selectors or with a hook.
You can read about the pros and cons of using one form or another in the
Selectors vs Hook section.

#### store.js
```javascript
import {create, ref} from 'picofly'

// may be a simple object
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
  let app = create(state)
  
  // you can attach any service objects to the store
  // ref helps to keep this objects as is
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

This example shows how to use picofly with a hook.

```javascript
import {memo} from 'react'
import {useStore} from 'picofly/react'
import Video from './video'

export default memo(VideoList)

// VideoList component uses video ids only
// so it will only re-render when a video is added or removed
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

This example shows how to use picofly with selectors.  
Selector is a pure function that derives some data from the store or
attach action.

Selectors are called in render context so you can use any hooks inside.

I recommend keeping selectors as simple and generic as possible
so that they can be reused between components.
Complex data selections can be done through their combinations.  
Read more in the section Selectors vs Hook.

```javascript
import {useCallback} from 'react'
import {select} from 'picofly/react'

// this selector gets video data from the store
// by id passed to component in the properties 
let videoById = (app, props) => ({
  video: app.videos.get(props.id),
})

// actions normally imported from the business logic layer
let watchVideo = async (app, id) => {
  await app.api.watchVideo(id)

  let video = app.videos.get(id)
  video.watched = true
}

// use select() to combine selectors and attach them to component
// all props returned from selectors will be merged and passed to component
export default select(
  videoById,
  (app, props) => ({
    onWatched: useCallback(() => watchVideo(app, props.id), [props.id]),
  }),
)(Video)

// Video component depends on a `name` and `watched` only
// so it will only re-render if any of these properties change
function Video({
  video = {},
  onWatched,
}) {
  return (
    <div>
      <span>{video.name}</span>
      <span>{video.watched ? "✅" : "🚫"}</span>
      <button onClick={onWatched}>WATCH</button>
    </div>
  )
}
```
