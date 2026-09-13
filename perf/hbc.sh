#!/bin/sh
# Compiles every bundle to hermes bytecode, the way a react native release
# ships it, so a run does not pay the compiler on every process start.
# run.sh does the same lazily for what it needs; this fills the whole cache
# at once, which is what the archive carries.
#
# Usage: ./perf/hbc.sh [engine]        default .tmp/hermes
#        PERF_LIBS="picofly mobx" ./perf/hbc.sh
set -e
cd "$(dirname "$0")/.."

engine=${1:-${PERF_ENGINE:-.tmp/hermes}}
libs=${PERF_LIBS:-picofly valtio mobx}

command -v "$engine" > /dev/null || test -x "$engine" || {
  echo "no hermes at $engine, build it with ./perf/hermes.sh" >&2
  exit 1
}

tmpjs=$(mktemp)
trap 'rm -f "$tmpjs"' EXIT
mkdir -p perf/bundles/hbc

n=0
for file in perf/bundles/*.js; do
  flat=$(basename "$file" .js)
  # fill-arr-num-100 back into fill/arr/num-100: the first two are the
  # group and the type, the rest is the name and may hold dashes of its own
  bench=$(echo "$flat" | awk -F- '{
    printf "%s/%s/", $1, $2
    for (i = 3; i <= NF; i++) printf "%s%s", $i, (i < NF ? "-" : "")
  }')

  for lib in $libs; do
    hbc="perf/bundles/hbc/$flat-$lib.hbc"
    [ -f "$hbc" ] && [ ! "$file" -nt "$hbc" ] && continue

    printf 'globalThis.__perfArgs=["1","%s","%s"];\n' "$lib" "$bench" > "$tmpjs"
    cat "$file" >> "$tmpjs"
    "$engine" -emit-binary -max-diagnostic-width=80 -w -O -out "$hbc" "$tmpjs"
    n=$((n + 1))
  done
done

echo "compiled: $n, cache $(du -sh perf/bundles/hbc | cut -f1)"
