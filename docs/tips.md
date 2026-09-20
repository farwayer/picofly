# Tips

## Disable React Compiler

You do not need it with *Picofly*. The compiler goes after the same problem, a
component re-rendered for nothing, by memoizing everything in every component,
blindly.

Like any deal with the devil, it has a price: bloating the app bundle with
checks around every computation, callback and element, where they are needed
and where they are not at all.

Worse, `Map` and `Set`, the fastest way to keep a collection, are built to be
mutated, and the compiler forces you to copy them on every change.

More in [Mobx Memoizes Components (You don't need React Compiler)](https://www.mikejohnson.dev/posts/2024/06/mobx-react-compiler)
by Mike Johnson.

A component on *Picofly* already renders only when a key it read changes, so
there is little left for the compiler to save.

With React Compiler on, *Picofly* will most likely not work as it should. The
cache compares by reference, and a store object keeps its reference while the
data inside changes.

The clean way is `compilationMode: 'annotation'` in the compiler config. Or
keep the default and put `"use no memo"` on the components that read the
store.

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
