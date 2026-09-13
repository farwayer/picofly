#!/bin/sh
# Runs every benchmark and writes one timestamped tsv into perf/results.
# One process per benchmark and library, so nobody pays for running second.
# The order of the three libraries rotates every pass.
#
# Usage: ./perf/run.sh [rounds] [what]   default 3 rounds, every bench
#        what selects the benchmarks, like ab.sh does:
#          read             a whole group, also fill and update
#          read/map         one type inside a group
#          read/map/size    one benchmark, several separated by spaces
#          app              the react app benches, left out of `all`
#          app/map          one type inside them
#        PERF_CPUS=0,2,4          pin to those cores, empty turns pinning off
#        PERF_ENGINE=/usr/bin/js140   run the bundles from ./perf/shells.sh
#        PERF_COOL=2              pause between processes on a hot machine
#        PERF_NODE=--predictable  node flags, none by default
#        PERF_LIBS=picofly        only these libs, in this order, no rotation
#        PERF_NOARGS=1            the engine takes no script arguments:
#                                 the bundle is compiled to bytecode with
#                                 them baked in, the way react native
#                                 ships it. On by itself for hermes
set -e
cd "$(dirname "$0")/.."

rounds=${1:-3}
what=${2:-all}
passes=$((rounds * 3))
cpus=${PERF_CPUS-0,2,4,6}
engine=${PERF_ENGINE-}
node_flags=${PERF_NODE-}
picked=${PERF_LIBS-}
noargs=${PERF_NOARGS-}
tab=$(printf '\t')
tmpjs=$(mktemp)
tmpout=$(mktemp)
trap 'rm -f "$tmpjs" "$tmpout"' EXIT

# hermes is the one shell that takes no script arguments, and it says so
# in its own name
case "$engine" in
  *hermes*) noargs=${PERF_NOARGS-1} ;;
esac

pin=
if [ -n "$cpus" ]; then
  if command -v taskset > /dev/null; then
    pin="taskset -c $cpus"
  else
    echo "taskset not found, running unpinned"
  fi
fi

if [ -n "$engine" ]; then
  test -d perf/bundles || { echo "run ./perf/shells.sh first"; exit 1; }
fi

# a selector turns into a list of bench ids
expand() {
  for sel in $1; do
    case "$sel" in
      all) ls_benches perf/fill/*/*.js perf/update/*/*.js perf/read/*/*.js ;;
      fill|update|read|app) ls_benches "perf/$sel"/*/*.js ;;
      */*/*) ls_benches perf/$sel.js ;;
      */*) ls_benches "perf/$sel"/*.js ;;
      *) echo "no such group: $sel" >&2; exit 1 ;;
    esac
  done
}

ls_benches() {
  for f in "$@"; do
    test -f "$f" || { echo "nothing matched" >&2; exit 1; }
    f=${f#perf/}
    echo "${f%.js}"
  done
}

benches=$(expand "$what")

# the app benches want react and a dom, so they only run in node
if [ -n "$engine" ]; then
  case "$benches" in
    *app/*) echo "app benches need node, unset PERF_ENGINE" >&2; exit 1 ;;
  esac
fi

stamp=$(date +%Y-%m-%dT%H-%M-%S)
out="perf/results/$stamp.tsv"
mkdir -p perf/results

{
  printf '# date\t%s\n' "$(date -Iseconds)"
  printf '# engine\t%s\n' "${engine:-node $(node -v)}"
  printf '# os\t%s\n' "$(uname -sr)"
  printf '# cpu\t%s\n' "$(node -p 'require("os").cpus()[0].model')"
  printf '# cpus\t%s\n' "${cpus:-any}"
  printf '# flags\t%s\n' "${node_flags:-none}"
  printf '# passes\t%s\n' "$passes"
  printf '# order\tone process per lib, rotated by pass\n'
} > "$out"

pass=1
while [ "$pass" -le "$passes" ]; do
  echo "--- pass $pass of $passes"

  case $(( (pass - 1) % 3 )) in
    0) order='picofly valtio mobx' ;;
    1) order='valtio mobx picofly' ;;
    2) order='mobx picofly valtio' ;;
  esac

  # a chosen list runs as given: nobody to rotate against
  [ -z "$picked" ] || order=$picked

  for bench in $benches; do
    f="perf/$bench.js"

    # an app bench has a fourth column, the same app with no store at all,
    # and react is only worth measuring in a production build
    libs=$order
    pre=
    case "$bench" in
      app/*)
        [ -n "$picked" ] || libs="$order basic"
        pre='env NODE_ENV=production'
        ;;
    esac

    for lib in $libs; do
      sleep "${PERF_COOL:-0}"

      if [ -n "$engine" ]; then
        file="perf/bundles/$(echo "$bench" | tr / -).js"

        if [ -n "$noargs" ]; then
          # a real app ships bytecode, not source: react native compiles
          # the bundle with `-O -emit-binary` and hands the vm the result,
          # so the run does the same. The shell takes no arguments, so the
          # library goes into the bytecode (the bench name is already in
          # the bundle) and only the pass is patched into the output
          hbc="perf/bundles/hbc/$(echo "$bench" | tr / -)-$lib.hbc"

          # bytecode carries a version, so a cache from another hermes is
          # no good. Compile when it is missing, older than the bundle, or
          # refused — the last check is the run itself, and when it works
          # its output is already in hand
          if [ ! -f "$hbc" ] || [ "$file" -nt "$hbc" ] ||
             ! $pin $engine "$hbc" > "$tmpout" 2> /dev/null; then
            mkdir -p perf/bundles/hbc
            printf 'globalThis.__perfArgs=["1","%s","%s"];\n' \
              "$lib" "$bench" > "$tmpjs"
            cat "$file" >> "$tmpjs"
            "$engine" -emit-binary -max-diagnostic-width=80 -w -O \
              -out "$hbc" "$tmpjs"
            $pin $engine "$hbc" > "$tmpout"
          fi

          sed "s/^1$tab/$pass$tab/" < "$tmpout" >> "$out"
        else
          $pin $engine "$file" -- "$pass" "$lib" "$bench" >> "$out"
        fi
      else
        $pre $pin node $node_flags --expose-gc "$f" -- "$pass" "$lib" "$bench" >> "$out"
      fi
    done
  done

  pass=$((pass + 1))
done

echo
echo "written to $out"
node perf/report.js "$out"

echo
echo "$stamp.tsv"
