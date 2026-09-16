# Tips

## Without context

Not happy with context? Wrap `useStore` in a small hook.

```js
export let useMyApp = () => {
	let app = useRef().current ??= create()
	return useStore(app)
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
