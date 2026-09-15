# Tips

## Without context

Not happy with context? Wrap `useStore` in a small hook.

```js
export let useMyApp = () => {
  let app = useRef().current ??= create()
  return useStore(app)
}
```
