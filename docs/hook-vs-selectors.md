# Hook vs Selectors

Both work, and nothing stops you from mixing them (except good taste 🙂). The
hook is quicker to start with, selectors hold up better as things grow.

<Compare names={['hook', 'selector']}>

```jsx
export default function Video({id}) {
  let app = useStore()
  let video = app.videos.get(id)

  return <span>{video.name}</span>
}
```

```jsx
let videoById = (app, props) => ({
  video: app.videos.get(props.id),
})

export default select(videoById)(Video)

function Video({video}) {
  return <span>{video.name}</span>
}
```

</Compare>

## Rule of thumb

Judge by complexity, not page count. It comes down to how many data models you
have, and how tangled the logic is.

- **A couple of data models, a domain you can hold in your head** — use the hook.
- **Many models, one tangled domain or several** — selectors, no question.
- **Somewhere in between, or testing matters** — go with selectors from the
  start. The app will only get more complex, and switching later costs more.

## The hook is one function

Nothing to wire up, no second concept to learn. On a small app that's simply
less to type, and a perfectly good place to start.

## Selectors split it in two

Instead of one component using the hook, you get two pieces. A *selector* picks
the data out, and a pure UI *component* shows it. Here's what that buys you.

- **Both halves are reusable** — the selector knows nothing about the component,
  the component knows nothing about the store. The hook version is one lump,
  reusable only as a whole.
- **Testing gets simpler** — a pure function you call, and a component you
  render with a plain object. No store, no provider, no mocks.
- **No almost-identical components** — showing the same thing somewhere else
  means swapping the selector, not copying the component and changing one line
  in the middle.
- **Logic stops leaking into markup** — on a small app the split is pointless
  ceremony; on a big one it's the difference between a component you read in ten
  seconds and one you reverse-engineer.
- **You compose instead of grow** — selectors are small enough to combine:
  `select(videoById, isOwner, watchAction)(Video)`. Every piece stays simple on
  its own.
- **The bundle gets smaller** — you snap the app together from small reusable
  parts, so a selector or a component ships once instead of being copied into
  near-identical variants.

## How small should a selector be?

A selector can do real work. It can filter a list, join two collections, attach
an action. But the smaller and more generic a selector is, the more places it fits,
and complicated selections usually come out of combining a few of them.

Don't take that too far. Splitting pays off only when the pieces can actually
travel apart. If the video and its author always come together, one selector
handing over both is the right size.

## Not every selector needs a name

Name a selector when something else will use it. For a one-off, write it right
in the `select()` call — it's still a plain function, it just has nowhere to be
imported from.

```jsx
export default select(
  videoById,
  (app, props) => ({
    canEdit: props.video?.ownerId === app.user.id,
    onWatched: () => watchVideo(app, props.id),
  }),
)(Video)
```

Selectors run in order and each one sees what the previous returned, so the
inline one picks up `video` from `videoById`.
