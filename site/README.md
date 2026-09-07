# picofly site

Landing page for picofly, built on picofly.

```
yarn start   # dev server
yarn build   # dist/
yarn check   # tsc --noEmit
```

Preact + Vite, TypeScript only, no CSS framework and no runtime
dependencies other than preact and picofly.

Layout follows the store/ui split:

- `src/store` — `state.ts` (plain classes), `index.ts` (`create()` on the
  default proxifier), `actions.ts` (`(app, ...args) => void`)
- `src/ui` — `pages/<page>/index.tsx` is a page, `app-views/` is what every
  page shows, `views/` is what several pages share, and a component used by
  one page lives in `pages/<page>/views/`
- `src/const.ts` — copy that is data: api entries, benchmarks, code samples
- `src/lib` — `cn`, `md` (inline markup for those strings), `hl` (highlighter)

Article pages are markdown in the repo's `docs/`, so GitHub renders them too.
`@mdx-js/rollup` compiles them at build time and `views/article.tsx` maps the
tags onto the site's classes; a page can hand its own components down and use
them in the text. Nothing of the parser reaches the bundle.

The logo also lives in `docs/` (the root README shows it) and is imported as
an asset. The favicon is the only file in `public/`.
