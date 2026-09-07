#!/bin/sh
# Runs every benchmark and writes one timestamped tsv into perf/results.
# One process per benchmark and library, so nobody pays for running second.
# The order of the three libraries rotates every pass.
#
# Usage: ./perf/run.sh [rounds]   default 3, passes where each lib leads
#        PERF_CPUS=0,2,4          pin to those cores, empty turns pinning off
#        PERF_ENGINE=/usr/bin/js140   run the bundles from ./perf/shells.sh
#        PERF_COOL=2              pause between processes on a hot machine
set -e
cd "$(dirname "$0")/.."

rounds=${1:-3}
passes=$((rounds * 3))
cpus=${PERF_CPUS-0,2,4,6}
engine=${PERF_ENGINE-}

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

stamp=$(date +%Y-%m-%dT%H-%M-%S)
out="perf/results/$stamp.tsv"
mkdir -p perf/results

{
  printf '# date\t%s\n' "$(date -Iseconds)"
  printf '# engine\t%s\n' "${engine:-node $(node -v)}"
  printf '# os\t%s\n' "$(uname -sr)"
  printf '# cpu\t%s\n' "$(node -p 'require("os").cpus()[0].model')"
  printf '# cpus\t%s\n' "${cpus:-any}"
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

  for f in perf/fill/*/*.js perf/update/*/*.js perf/read/*/*.js; do
    bench=${f#perf/}
    bench=${bench%.js}

    for lib in $order; do
      sleep "${PERF_COOL:-0}"

      if [ -n "$engine" ]; then
        file="perf/bundles/$(echo "$bench" | tr / -).js"
        $pin $engine "$file" -- "$pass" "$lib" "$bench" >> "$out"
      else
        $pin node --expose-gc "$f" -- "$pass" "$lib" "$bench" >> "$out"
      fi
    done
  done

  pass=$((pass + 1))
done

echo
echo "written to $out"
node perf/report.js "$out"
