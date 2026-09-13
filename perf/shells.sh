#!/bin/sh
# Bundles every benchmark into a standalone script for bare JS shells.
# Usage: ./perf/shells.sh
# The bundles land in perf/bundles and are run by ./perf/run.sh with
# PERF_ENGINE=/usr/bin/js140 or any other shell.
set -e
cd "$(dirname "$0")/.."

banner='var __a = typeof scriptArgs !== "undefined" ? scriptArgs
  : typeof arguments !== "undefined" ? arguments : []
globalThis.__perfArgs = globalThis.__perfArgs || Array.prototype.slice.call(__a);'

esbuild=node_modules/.bin/esbuild
if [ ! -x "$esbuild" ]; then
  esbuild=$(command -v esbuild || true)
fi
if [ -z "$esbuild" ]; then
  echo "esbuild not found, install it or run this in the repo"
  exit 1
fi

rm -rf perf/bundles
mkdir -p perf/bundles

for f in perf/fill/*/*.js perf/update/*/*.js perf/read/*/*.js; do
  rel=${f#perf/}
  rel=${rel%.js}
  flat=$(echo "$rel" | tr / -)
  # a shell without script arguments has no other way to learn which
  # benchmark it is running, and the name is the same every time
  "$esbuild" --bundle --format=iife --log-level=error \
    --banner:js="$banner
globalThis.__perfBench = \"$rel\";" "$f" > "perf/bundles/$flat.js"
done

echo "bundled: $(ls perf/bundles | wc -l)"
