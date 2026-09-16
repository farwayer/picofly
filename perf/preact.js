// the same app benches on preact instead of react:
//   PERF_NODE=--import=./perf/preact.js ./perf/run.sh 3 app
import {registerHooks} from 'node:module'
import {options} from 'preact'

// in-thread hooks, so a library that still requires react in cjs is caught too
registerHooks({
  resolve(spec, ctx, next) {
    return next(map[spec] ?? spec, ctx)
  },
})

let map = {
  'react': 'preact/compat',
  'react-dom': 'preact/compat',
  'react-dom/client': 'preact/compat/client',
  'react/jsx-runtime': 'preact/jsx-runtime',
}

// react runs effects inside flushSync, preact leaves them for the next frame.
// A bench that never yields would measure a renderer doing half the work, so
// effects land in the same tick here too. PERF_PREACT_FRAME=1 leaves the
// scheduling alone instead, for a cross-check against PERF_DRAIN
if (!process.env.PERF_PREACT_FRAME) options.requestAnimationFrame = cb => cb()
