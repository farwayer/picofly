# Tips

## Disable React Compiler

You do not need it with *Picofly*. The compiler wraps every computation,
callback and element of every component in a cache, to skip re-renders and
repeated work. A component on *Picofly* already renders only when a key it
read changes, so the cache has nothing to save and only adds code and checks.

Worse, with it on things break. The cache compares by reference, and a store
object keeps its reference while the data inside changes. A `map` over a store
array, or a store object handed to a child, shows the old data. Only primitives
survive.

The clean way is `compilationMode: 'annotation'` in the compiler config. It
compiles only the components marked `"use memo"`, the store ones stay as
written. Or keep the default and put `"use no memo"` on the components that
read the store.

```jsx
function Videos() {
	"use no memo"
	let app = useStore()

	return [...app.videos.keys()].map(id => (
		<Video key={id} id={id}/>
	))
}
```

## When a parent renders

React renders a component every time its parent renders, no matter what it
took from the store. Wrap it in `memo` and let it read the store itself. Then
*Picofly* wakes it when its data changes, and the parent stops waking it for
nothing.

```jsx
let Title = memo(() => {
	let app = useStore()

	return <h1>{app.title}</h1>
})
```

With `select()` this is already done for you: it hands back a memoized
wrapper.

Putting `memo` on the component you pass to `select()` breaks updates whenever
a selector returns an object the component reads inside. The object stays the
same, `memo` skips the render and the screen goes stale. In rare cases it pays
off, but only if you know exactly what you are doing.

## Without context

Not happy with context? Wrap `useStore` in a small hook.

```js
export let useMyApp = () => {
	let app = useRef().current ??= create()
	return useStore(app)
}
```
