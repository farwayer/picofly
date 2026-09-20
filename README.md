# Picofly

_Tiny state manager, built with ❤️_

[![NPM version](https://img.shields.io/npm/v/picofly)](https://www.npmjs.com/package/picofly)

After many years of development and testing in real apps, Picofly 1.0 is out! 🎉  
And it got itself a site [picofly.dev](https://picofly.dev)

<img src="docs/logo.svg" height="192" align="right">

⚡ **Fast**: lazy proxies, hand-tuned hot paths, renders only what changed  
🤏 **Tiny**: *683 B* core, *1.27 kB* with React support  
🥧 **Simple**: *~160 lines* of code, *~140* more for React  
🍳 **Handy**: you think about what to do, not how  
⚛️ **React & React Native**: *hook* or *selectors*, whichever fits  
🔋 **Charged**: *Map*, *Set* and *TypeScript* out of the box  
🪟 **Transparent**: your objects stay your objects

#### Supported

*React* >= 19  
*React Native* >= 0.78  
*Preact* >= 11 (beta now, [why not 10](https://github.com/preactjs/preact/issues/4299))

## React Compiler?

No, and not planned. You do not need it with *Picofly*.  

More in [Tips](docs/tips.md#disable-react-compiler) and in [Mobx Memoizes Components (You don't need React Compiler)](https://www.mikejohnson.dev/posts/2024/06/mobx-react-compiler).

Worse, with React Compiler on, *Picofly* will most likely not work as it
should. Use `compilationMode: 'annotation'`, or put `"use no memo"` on the
components that read the store.

## Install

```sh
npm i picofly
```

## How to use

`create(state)` wraps your state and gives back the store. Read what you need
in a component and write from anywhere outside render. The component renders
only when a property it actually read changes.

Objects, arrays, `Map` and `Set` are proxied. `Date`, `Error`, `RegExp` and
the like stay as they are.

### React example

Picofly works with a hook or with selectors. The trade-offs are in
[Hook vs Selectors](docs/hook-vs-selectors.md).

#### store.js
```javascript
import {create, markRaw} from 'picofly'

// a plain object works too
class State {
	api = null
	videos = new Map()
}

export let createStore = () => {
	let state = new State()
	let app = create(state)

	// service objects can live on the store too
	// markRaw keeps them as they are, never proxied
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

This one uses the hook.

```javascript
import {useStore} from 'picofly/react'
import Video from './video'

// VideoList reads the ids only, so it renders
// only when a video is added or removed
export default function VideoList() {
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

This one uses selectors.

A selector is a plain function that picks data out of the store or attaches an
action. Selectors run in the render context, so hooks work inside them.

Keep them small and generic and they will be reused between components;
a complex selection is a combination of simple ones.

```javascript
import {select} from 'picofly/react'

// takes the video out of the store by the id in props
let videoById = (app, props) => ({
	video: app.videos.get(props.id),
})

// actions usually come from the business logic layer
let watchVideo = async (app, id) => {
	await app.api.watchVideo(id)

	let video = app.videos.get(id)
	video.watched = true
}

// select() merges what the selectors return
// and passes it to the component as props
export default select(
	videoById,
	(app, props) => ({
		onWatched: () => watchVideo(app, props.id),
	}),
)(Video)

// Video reads name and watched only, so it renders
// when one of them changes
function Video({
	video = {},
	onWatched,
}) {
	return (
		<div>
			<span>{video.name}</span>
			<span>{video.watched ? '✅' : '🚫'}</span>
			<button onClick={onWatched}>WATCH</button>
		</div>
	)
}
```

## Docs

- [API and benchmarks](https://picofly.dev)
- [Why the hell another one?](docs/why.md)
- [Hook vs Selectors](docs/hook-vs-selectors.md)
- [The Good, the Bad, the Ugly architecture](docs/arch.md)
- [Tips](docs/tips.md)
