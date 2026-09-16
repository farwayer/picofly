# Picofly

_Lightweight handy state manager, simple, fast and built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly.svg)](https://www.npmjs.com/package/picofly)

<img src="docs/logo.svg" height="192" align="right">

⚡ **Fast**: lazy proxies, hand-tuned hot paths, renders only what changed  
🤏 **Tiny**: *683 B* core, *1.24 kB* with React support  
🥧 **Simple**: *~160 lines* of sparse code + *~120 lines* for React support  
🍳 **Handy**: you will worry about what needs to be done, not how  
⚛️ **React & React Native**: *hooks* or *selectors*, modern React API  
🔋 **Charged**: *Map* and *Set*, *TypeScript* support and more  
🪟 **Transparent**: original objects are not modified

#### Supported

*React* >= 19  
*React Native* >= 0.78  
*Preact* >= 11 (beta now, [why not 10](https://github.com/preactjs/preact/issues/4299))

## Install

```sh
npm i picofly
yarn add picofly
pnpm add picofly
```

## How to use

`create(state)` wraps your state and gives back the store. Read what you need
in a component, write from anywhere: a component re-renders only when a
property it has actually read changes.

By default picofly proxies objects, arrays, `Map` and `Set`, and leaves
special objects like `Date`, `Error` or `RegExp` as they are. Picking fewer
rules ships fewer bytes and does less on every read.

### React example

Picofly works with a hook or with selectors, the trade-offs are in
[Hook vs selectors](docs/hook-vs-selectors.md).

#### store.js
```javascript
import {create, markRaw} from 'picofly'

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
	// markRaw keeps them as is, never proxied
	app.api = markRaw(app, createApi())
	
	return app
}
```

#### app.js
```javascript
import {Picofly} from 'picofly/react'
import {createStore} from './store'
import VideoList from './video-list'

let app = createStore()

let App = () => {
	return (
		<Picofly value={app}>
			<VideoList/>
		</Picofly>
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
	
	let addVideo = () => {
		app.videos.set(Math.random(), {name: 'Cool video', watched: false})
	}
	
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
attach action. Selectors are called in render context so you can use any hooks inside.

I recommend keeping selectors as simple and generic as possible
so that they can be reused between components.
Complex data selections can be done through their combinations.  
Read more in [Hook vs selectors](docs/hook-vs-selectors.md).

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

## Docs

- [Why the hell another one?](docs/why.md)
- [Hook vs selectors](docs/hook-vs-selectors.md)
- [The Good, the Bad, the Ugly architecture](docs/arch.md)
