#!/bin/sh
# Rebuilds public/og.png, the 1200x630 card that link previews show. One
# html serves every route, so this one card stands for the whole site.
#
# Usage: ./og.sh
#
# The slogan says how it feels, the line under it says what it is — the
# card is often the first time someone sees the name. Neither carries a
# byte count on purpose: a number baked into a png is one more place to
# remember when it changes.
#
# Type is set big on purpose. Chats show the card around 400 px wide, so
# everything here is read at a third of its size — and still under the
# wordmark, which has to stay the largest thing on the card.
#
# 1.91:1 is what the clients that matter show whole, so the margins are
# air, not safety: about 110 px around the block. X renders the card 2:1
# and trims 15 px top and bottom, nowhere near anything.
#
# Needs rsvg-convert (librsvg) and magick (ImageMagick).
set -e
cd "$(dirname "$0")"

slogan='Just mutate. It flies.'
line='state manager for JavaScript, React and React Native'

# --bg, --fg and --fg2 from styles.css
bg='#faf9f6'
fg='#191d1a'
fg2='#5b635e'

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

rsvg-convert -w 820 ../../docs/logo-h.svg -o "$tmp/lockup.png"

# flat art, so 32 colours are indistinguishable and halve the file
magick -size 1200x630 "xc:$bg" \
  "$tmp/lockup.png" -gravity center -geometry +0-112 -composite \
  -font Noto-Sans-Regular -gravity center \
  -pointsize 80 -fill "$fg" -annotate +0+92 "$slogan" \
  -pointsize 40 -fill "$fg2" -annotate +0+202 "$line" \
  -strip -colors 32 -define png:compression-level=9 \
  ../public/og.png

echo "site/public/og.png  $(wc -c < ../public/og.png) B"
