#!/bin/sh
# Runs the benchmarks in two unpacked archives, alternating
# them pass by pass so drift hits both.
# Usage: ./ab.sh dirA dirB [passes] [what]
# what selects the benchmarks, every one of them by default:
#   read             a whole group, also fill, update and app
#   read/map         one type inside a group
#   read/map/size    one benchmark, several separated by spaces
# Both sides are pinned to four P-cores, no hyperthread
# siblings. PERF_CPUS overrides, PERF_CPUS= turns it off.
# PERF_NODE adds node flags, --predictable by default: it
# kills the background GC and compiler threads and the two
# modes they put in every number. PERF_NODE= turns it off
set -e

node_flags=${PERF_NODE---predictable}

a=$1
b=$2
passes=${3:-6}
what=${4:-all}
if [ ! -d "$a" ] || [ ! -d "$b" ]; then
  echo "usage: ./ab.sh dirA dirB [passes] [what]"
  exit 1
fi

root=$PWD

# a selector turns into a list of bench ids, found in dirA
expand() {
  for sel in $1; do
    case "$sel" in
      all) ls_benches "$a/perf"/*/*/*.js ;;
      fill|update|read|app) ls_benches "$a/perf/$sel"/*/*.js ;;
      */*/*) echo "$sel" ;;
      */*) ls_benches "$a/perf/$sel"/*.js ;;
      *) echo "no such group: $sel" >&2; exit 1 ;;
    esac
  done
}

ls_benches() {
  for f in "$@"; do
    test -f "$f" || { echo "nothing matched" >&2; exit 1; }
    f=${f#"$a"/perf/}
    echo "${f%.js}"
  done
}

benches=$(expand "$what")

head() { # tsv
  printf '# date\t%s\n' "$(date -Iseconds)" > "$1"
  printf '# node\t%s\n' "$(node -v)" >> "$1"
  printf '# passes\t%s\n' "$passes" >> "$1"
  printf '# order\talternating\n' >> "$1"
  printf '# cpus\t%s\n' "${cpus:-any}" >> "$1"
  printf '# flags\t%s\n' "${node_flags:-none}" >> "$1"
}

cpus=${PERF_CPUS-0,2,4,6}
pin=
if [ -n "$cpus" ]; then
  if command -v taskset > /dev/null; then
    pin="taskset -c $cpus"
  else
    echo "taskset not found, running unpinned"
  fi
fi

head "$root/a.tsv"
head "$root/b.tsv"

one() { # dir, tsv, pass
  cd "$1"
  for f in $benches; do
    # react is only worth measuring in a production build
    pre=
    case "$f" in
      app/*) pre='env NODE_ENV=production' ;;
    esac

    $pre $pin node $node_flags --expose-gc "perf/$f.js" \
      -- "$3" picofly "$f" >> "$2"
  done
  cd "$root"
}

pass=1
while [ "$pass" -le "$passes" ]; do
  echo "--- pass $pass of $passes"
  if [ $((pass % 2)) -eq 1 ]; then
    one "$a" "$root/a.tsv" "$pass"
    one "$b" "$root/b.tsv" "$pass"
  else
    one "$b" "$root/b.tsv" "$pass"
    one "$a" "$root/a.tsv" "$pass"
  fi
  pass=$((pass + 1))
done

echo
node -e '
let fs = require("fs")
let read = f => {
  let m = new Map()
  for (let l of fs.readFileSync(f, "utf8").split("\n")) {
    if (l.startsWith("#") || !l.trim()) continue
    let [pass, bench, label, ns] = l.split("\t")
    if (!label.startsWith("Picofly")) continue
    ;(m.get(bench) ?? m.set(bench, []).get(bench)).push([+pass, +ns])
  }
  return m
}
let [fa, fb, na, nb] = process.argv.slice(1)
let A = read(fa), B = read(fb)

let stat = points => {
  let ns = points.map(([, v]) => v)
  let sorted = [...ns].sort((p, q) => p - q)
  let mean = ns.reduce((s, x) => s + x, 0) / ns.length
  let out = {min: sorted[0], median: sorted[sorted.length >> 1], rme: 0, drift: 0}
  if (ns.length < 2) return out

  let v = ns.reduce((s, x) => s + (x - mean) ** 2, 0) / (ns.length - 1)
  out.rme = 1.96 * Math.sqrt(v) / Math.sqrt(ns.length) / mean * 100

  let ps = points.map(([p]) => p)
  let mp = ps.reduce((s, x) => s + x, 0) / ps.length
  let cov = points.reduce((s, [p, x]) => s + (p - mp) * (x - mean), 0)
  let vp = ps.reduce((s, p) => s + (p - mp) ** 2, 0)
  out.drift = vp ? cov / vp / mean * 100 : 0
  return out
}

let n = v => Math.round(v).toLocaleString("en-US")
let pc = v => (v > 0 ? "+" : "") + v.toFixed(1) + "%"
let w = Math.max(...[...A.keys()].map(k => k.length))

console.log("A =", na, " B =", nb, "\n")
console.log("bench".padEnd(w), "min A".padStart(9), "min B".padStart(9),
  "med A".padStart(9), "med B".padStart(9), "diff".padStart(8),
  "rme".padStart(7), "drift".padStart(8))

for (let [bench, points] of A) {
  let a = stat(points), b = stat(B.get(bench) ?? [[1, 0]])
  console.log(bench.padEnd(w), n(a.min).padStart(9), n(b.min).padStart(9),
    n(a.median).padStart(9), n(b.median).padStart(9),
    pc((b.median / a.median - 1) * 100).padStart(8),
    (Math.max(a.rme, b.rme).toFixed(1) + "%").padStart(7),
    pc(Math.max(a.drift, b.drift, -0)).padStart(8))
}
' "$root/a.tsv" "$root/b.tsv" "$a" "$b"
