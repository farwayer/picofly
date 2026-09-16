#!/bin/sh
# Rebuilds public/fonts/noto-sans.woff2. Takes the latin file from
# @fontsource-variable/noto-sans — Google's build, one weight axis,
# no width — narrows that axis to the weights the CSS asks for and
# keeps only the characters the pages print. 36 kB become 12 kB.
#
# The version is the one in package.json, so a new Noto Sans shows
# up as a dependency bump and not as a silently different file.
#
# Usage: ./font.sh
#
# When a page starts printing a new character, add it to `chars` and
# run this again. Anything left out falls back to the system font —
# arrows are that case, Noto Sans has none, so they are icons here.
#
# Needs pyftsubset (fonttools) and the woff2 tools.
set -e
cd "$(dirname "$0")"

# ASCII, micro, middle dot, en and em dash
chars="U+0020-007E,U+00B5,U+00B7,U+2013-2014"

pkg=@fontsource-variable/noto-sans
src=$(node -p \
  "require.resolve('$pkg/files/noto-sans-latin-wght-normal.woff2')")

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

cp "$src" "$tmp/latin.woff2"
woff2_decompress "$tmp/latin.woff2" > /dev/null 2>&1

# the site asks for 400 to 600, plus the 700 a bare <b> gets
fonttools varLib.instancer -q "$tmp/latin.ttf" wght=400:700 \
  -o "$tmp/range.ttf"

pyftsubset "$tmp/range.ttf" --unicodes="$chars" \
  --output-file="$tmp/noto-sans.ttf"

woff2_compress "$tmp/noto-sans.ttf" > /dev/null 2>&1

out=../public/fonts/noto-sans.woff2
mkdir -p ../public/fonts
mv "$tmp/noto-sans.woff2" "$out"

echo "site/public/fonts/noto-sans.woff2  $(wc -c < "$out") B"
