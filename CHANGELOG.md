# Changelog

## 1.0.1

### Fixed

- back on `useSyncExternalStore` to rule out a rare but theoretically possible
  tearing under concurrent rendering

## 1.0.0

### Breaking

- `create(state, proxify)` -> `create(state)` and `store(state, rules)`
- prebuilt combinations gone: `objMap`, `objMapIgnoreSpecialsRef` and friends
- `ref()`/`isRef()` -> `markRaw()`/`isRaw()`
- `StoreProvider`/`StoreContext` -> `Picofly`/`PicoflyContext`
- `select()`: `{getStore}` -> `{store}`, a store or a function returning it
- `useDerived()`, `withRef()`, `usePostRenderCallback()` gone
- `Object.defineProperty` is not tracked any more

### Added

- rules: `raw`, `map`, `set`, `builtins`, `obj`, pick them or write your own
- **`arr.length = n` notifies the dropped indexes**
- ready made selectors: `spec`, `item`, `callback`, `effect`
- more built-ins are left alone: `URL`, generators, boxed `Boolean`, etc.
- +137 tests (thanks Claude)
- benchmarks on V8, JSC and SpiderMonkey
- picofly got itself a site [picofly.dev](https://picofly.dev) 🎉

### Fixed

- deleting an inherited prop no longer notifies
- better TypeScript typings
- `NaN` over `NaN` no longer notifies, `-0` over `+0` does
- no notify when the write did not land
- no double `length` notify on arrays
- object keys in `Map` and `Set` always match now
- writing from a ref callback or a layout effect no longer throws
- a write from a layout effect on mount no longer gets lost

### Faster

- moving to the `set` trap made writes much faster
- the whole code was tuned with benchmarks
- faster iteration over `Map` and `Set`
- Map and Set track fewer reads
- `useStore` stops checking once the component is dirty
- a write wakes only the components that read that object
- 683 B minimal, 1.27 kB with React

## 0.1.0 — 2026-08-21

React types-only release: `select()` typings rewritten. No runtime changes.

- **void selectors** no longer break the chain — they contribute no props,
  matching runtime:

  ```ts
  select(initEffect, videoById)(Video)  // now typechecks
  ```

- conditional selectors supported — falsy alternatives are stripped, their
  props become optional outside and down the chain:

  ```js
  let item = (app, props) => item && {item}
  select(item)(C)  // <C id="1"/> and <C id="1" item={x}/> both ok
  ```

- prop checking is always on — a void selector used to silently disable it for
  the whole call, so hidden mismatches will now surface
- readable errors — offending props are named instead of a bare `never`:
  `... & { 'select: props missing in component': "mode" }`
- typings no longer error by themselves without `skipLibCheck`

## 0.0.20 — 2026-03-21

- improve typings

## 0.0.19 — 2025-09-03

- use `objMapSetIgnoreSpecialsRef` as the default proxifier to simplify usage

## 0.0.17 — 2024-11-10

- add Set support
- remove Hermes bug workarounds
- speed and size optimizations

## 0.0.13 — 2024-05-01

- hermes: fix wrong arr zero index check

## 0.0.12 — 2024-05-01

- array: fix zero index emit length change

## 0.0.11 — 2024-05-01

- notify about array length change
