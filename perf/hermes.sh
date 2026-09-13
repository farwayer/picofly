#!/bin/sh
# Builds Hermes for alpine in a container and puts the shell in .tmp.
# Pinned to the release React Native ships: 260318099.0.1 goes into RN
# 0.88. Any other tag or commit goes through HERMES_REF.
#
# Usage: ./perf/hermes.sh
#        HERMES_REF=<sha> ./perf/hermes.sh
#        PERF_ENGINE=.tmp/hermes ./perf/run.sh 3
#
# The shell to run is `hermes`, the vm. `shermes` next to it is the static
# compiler: it takes input files, so run.sh's arguments land on it as file
# names. Hermes takes no script arguments at all, so run.sh turns on its
# PERF_NOARGS mode as soon as the engine path names hermes.
set -eu
cd "$(dirname "$0")/.."

ref=${HERMES_REF:-hermes-v260318099.0.1}
image=${ALPINE_IMAGE:-docker.io/library/alpine:3.24}

mkdir -p .tmp
podman run --rm --pull=newer -e REF="$ref" -e JOBS="${HERMES_JOBS:-}" \
  -v "$PWD/.tmp:/out:Z" "$image" sh -eu -c '
  apk add --no-cache cmake git python3 build-base linux-headers samurai

  git clone --depth 1 --branch "$REF" \
    https://github.com/facebook/hermes /src 2> /dev/null ||
  {
    git clone --filter=blob:none https://github.com/facebook/hermes /src
    git -C /src checkout "$REF"
  }

  # samurai puts a ninja-compatible binary in the path, ninja-build hides
  # the real one in /usr/lib
  ninja=$(command -v ninja || command -v /usr/lib/ninja-build/bin/ninja)

  # the release profile react native builds: MinSizeRel with link time
  # optimisation and no debugger. HERMES_UNICODE_LITE is ours — a static
  # musl build has no icu, and RN turns HERMES_ENABLE_INTL on instead;
  # nothing a benchmark touches goes through either. The heap value mode
  # is left at HEAP_HV_64, which is what RN gets on ios; on android they
  # ask for PREFER32
  cmake -S /src -B /build -G Ninja \
    -DCMAKE_MAKE_PROGRAM="$ninja" \
    -DCMAKE_BUILD_TYPE=MinSizeRel \
    -DCMAKE_INTERPROCEDURAL_OPTIMIZATION=True \
    -DHERMES_ENABLE_DEBUGGER=OFF \
    -DHERMES_UNICODE_LITE=ON \
    -DCMAKE_CXX_FLAGS="-Dlseek64=lseek -Doff64_t=off_t" \
    -DCMAKE_EXE_LINKER_FLAGS=-static \
    -DHERMES_BUILD_SHARED_JSI=OFF \
    -DHERMES_ENABLE_TEST_SUITE=OFF

  # shermes is the static compiler and only exists on some branches, the
  # vm is what the benchmarks run
  cmake --build /build --target hermes -j"${JOBS:-$(nproc)}"

  cp /build/bin/hermes /out/
  test -f /build/bin/shermes && cp /build/bin/shermes /out/ || true
  git -C /src rev-parse HEAD > /out/hermes.ref
'

echo
echo "built from $(cat .tmp/hermes.ref)"
.tmp/hermes -version | sed -n '5,7p'
