# Why the hell another one?

*In short: because the others weren't ideal enough for me* 😮‍💨

*Picofly* is the result of 12+ years of using different state managers,
optimizing architecture and polishing web apps down to the smallest detail.

A state manager with no compromises between usability, size and speed:

- `create(state)` once, `useStore()` in a component, the whole API
- [From](#very-small) <Hi>795 B</Hi> with the React binding
- [Very fast](#very-fast): lazy proxies, hand-tuned hot paths
- Renders only what changed
- Plays by the spec, your objects stays untouched
- App business logic is just plain JS functions, async, generators, whatever
- Framework agnostic, but with React batteries included
- `Map` and `Set` support, [selectors](/hook-vs-selectors) for more complex apps

Why a state manager at all, and not `useState` and `useContext`? That is a
separate story: [The Good, the Bad, the Ugly architecture](/architecture).

## History

Once upon a time, when React was still green... Relax, no history tour. Nobody
ever cared what came before anyway.

Here are just the milestones I walked through, starting from the very first
React versions.

### Flux and Redux, the first for many

Actions, pure reducers and selectors sounded beautiful. After four or five
projects the boilerplate, in code and in the head, left it no chance for me.

### MobX to the rescue

Then *MobX*, later with *MobX-State-Tree* on top. It felt like rescue:

- Decorators made things simple
- Working with data looked like a plain mutation
- Only what changed rendered

The bill:

- Heavy and slow, back then (today it's [fast!](/performance))
- Decorators, poorly supported by runtimes and bundlers back then
- Less boilerplate, but still boilerplate
- Too much internal machinery to keep in the head
- Business code lived in functions nested inside the store, never fully clean

### Valtio, almost there

*Valtio* kept the *MobX* model and simplified nearly everything:

- Proxies instead of decorators
- Fast enough, small enough
- Minimal API, simple mental model
- Modern React through `useSyncExternalStore`

So why not stop? *Valtio* looks simple from the outside, but inside it is built
in a complicated way. Much more complicated than it could be.

*Valtio*, core with React binding, is <Hi>560 lines of code</Hi> (no comments, no
empty lines).

<Small>

- **`vanilla.mjs`** — 272
- **`proxy-compare`** — 232
- **`react.mjs`** — 56

</Small>

*Picofly* with the hook, <Hi>174 lines</Hi>.

<Small>

- **`store.js`** — 48
- **`rules/obj.js`** — 78
- **`react/use-store.js`** — 48

</Small>

And it is not about the size of the code or the extra layers (though those
too). It weighs heavily on [performance](/performance), on top of the penalty
Proxy already charges.

By then, after years of web development, I knew what the ideal state manager
looks like. *Valtio* was close. Not close enough.

So *Picofly* happened. Here is what it looks like, point by point.

## Minimal mental load

`create(state)` once, `useStore()` in a component. That is the whole hook story.

```tsx
// once, App is a plain class
// an object, Map or Set works too
let app = create(new App())

function Counter() {
  let app = useStore<App>()

  return (
    <button onClick={() => app.count++}>
      {app.count}
    </button>
  )
}
```

*Valtio* splits state in two. Write to the proxy, read from `useSnapshot()`. Two
objects, two identities, extra confusion. *Picofly* has one state.

*MobX* asks to be learned first. Decorators or `makeObservable`, `action` around
writes, `observer` around components. Rules to figure out, and then to keep in
mind. *Picofly* has none of them.

## Clean business logic

Any function that works with data is just a JS function. State comes in as a
parameter.

```ts
export let load = async (app: App) => {
  app.loading = true
  app.users = await api.users()
  app.loading = false
}
```

- Pure, async, side effects, generators, whatever
- Top level of the file
- No need for a global store variable
- Trivial to test
- Splits across files however you like

*Picofly* does not force any architecture on you. It takes one small but
important thing off your plate, tracking changes in data, and does it damn
well. If you are curious where my own search landed, read
[The Good, the Bad, the Ugly architecture](/architecture).

## Very small

Hand-crafted, simple, readable, byte-counted, covered end to end by tests.

- **picofly** — <Hi>579 B</Hi> (core),
  <Hi>795 B</Hi> (core + react)
- **picofly (full)** — <Hi>1.47 kB</Hi> (core + map + set),
  <Hi>1.69 kB</Hi> (core + map + set + react)
- **valtio** — <Hi>2.16 kB</Hi> (core + react),
  <Hi>3.29 kB</Hi> (core + react + map + set)
- **mobx** — <Hi>10.7 kB</Hi> (core), <Hi>14 kB</Hi> (core + react)

<Note>

\* Every number from [size-limit](https://evilmartians.com/opensource/size-limit), minified
and brotlied, React itself not counted.

</Note>

A whole site in tens of kB with *Picofly* and *Preact*? Easy.

## Very fast

The full story is on the [performance](/performance) page.

Proxies are created lazily, on first read. The backend sends 10,000 records,
the screen shows 10. *Picofly* stores the payload instantly. *Valtio* and *MobX* pay
for 10,000 proxies up front.

Median over the benchmarks of each category:

- **putting data in** — <Hi>422x</Hi> vs valtio, <Hi>508x</Hi> vs mobx
- **updating** — <Hi>7.3x</Hi> vs valtio, <Hi>4.8x</Hi> vs mobx
- **reading** — <Hi>4.2x</Hi> vs valtio, <Hi>1.0x</Hi> vs mobx *

<Note>

\* The first read pays a small penalty for lazy proxies. And *Picofly* uses a
real `Map` and `Set`, while *Valtio* and *MobX* replace them with emulations.

</Note>

Hot paths are hand-tuned, bench by bench.

## Only what changed renders

`useStore()` and `select()` track what the component reads. So `user.name = 'Bob'`
wakes whoever read `user.name` and nobody else.

Nothing to declare, nothing to subscribe to. It just works.

## The store locks during render

Writing to state from a render is one of the most common React mistakes.
*Picofly* locks the store while a component renders, so the mistake throws right
away instead of looping quietly.

## Batteries included

- React/React Native/Preact binding
- Native `Map` and `Set` support out of the box, not emulations *
- Ready-made [selectors](/api#spec)

<Note>

\* *Valtio* emulates `Map` and `Set` through `valtio/utils`, +1.1 kB and times
slower. *MobX* swaps them for its own `ObservableMap` and `ObservableSet`.
*Picofly* proxies the native ones, the `Map` you passed stays the same `Map`.

</Note>

## Plays by the spec

*Picofly* wraps your data in a Proxy and changes nothing else.

- `Map` and `Set` stay native, `instanceof Map` holds
- No `__store_internals_do_not_touch__` bolted onto your data
- Reads give you a proxy, your data keeps your own objects *
- Non-writable props throw, frozen objects stay frozen
- Getters, setters, symbol keys and class methods work as usual
- Your own Proxy keeps working, over the store or over the data you pass in

<Note>

\* *Valtio* replaces nested objects with its proxies right inside your data.
*MobX* copies everything into types of its own, and ignores descriptors.

</Note>

Two gaps:

- `Object.defineProperty` on a live store works, but the change is not tracked.
  Its proxy trap is far too slow, earlier versions of *Picofly* used it and
  dropped it on purpose.
- Private `#fields` cannot be read through a proxy.

<i>It took many years to make it this short. Now I'm happy to share Picofly with you.</i>
