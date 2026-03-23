# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Picofly is an ultra-lightweight proxy-based state management library for JavaScript, React, and React Native. Bundle size is a critical constraint (~500-700 bytes).

## Commands

- **Install**: `yarn`
- **Test all**: `yarn test` (uses UVU runner)
- **Test single file**: `yarn uvu tests arr` (matches filename pattern)
- **Check bundle size**: `yarn size` (strict limits configured in package.json)
- **Benchmarks**: `node perf/<file>.js`

## Architecture

The library has three layers: core store, proxify system, and React integration.

### Core Store (`src/store.js`)

A store's internal state is a flat array `$` with indexed slots:
- `$[0]`: proxify function, `$[1]`: proxy cache (WeakMap), `$[2]`: write subscribers (Set), `$[3]`: read subscribers (Set), `$[4]`: lock state

Two private symbols provide escape hatches from proxies: `$Sym` accesses internal state, `NakedSym` unwraps to the original object.

### Proxify System (`src/proxify/`)

Each data type (obj, map, set) has its own proxy handler. Composable proxify strategies combine them — the default is `objMapSetIgnoreSpecialsRef` which handles objects/arrays/Maps/Sets, skips special types (Date, RegExp, etc.), and respects `ref()` markers.

Proxies are cached per-object in a WeakMap and created lazily on first access.

### React Integration (`src/react/`)

- `useStore`: Tracks property reads during render via `onRead`, re-renders only when tracked properties change. Uses `useSyncExternalStore`. Store is locked during render to prevent mutations.
- `useDerived`: Computed values with automatic dependency tracking.
- `select`: HOC combining multiple `(store, props) => derivedProps` selectors.
- `memo` (in `src/utils/`): Non-React memoization with the same read-tracking approach.

### Package Exports

Three entry points: `picofly` (core), `picofly/react`, `picofly/utils`. All ESM.

## Key Conventions

- Yarn 4 with node-modules linker
- Pure ESM (no CJS)
- TypeScript types via `.d.ts` files (no TS compilation)
- Tests in `tests/` directory, one file per data type