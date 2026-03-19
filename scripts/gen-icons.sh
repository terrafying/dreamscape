#!/bin/bash
# Generates 192px and 512px PNG app icons from inline SVG
# Requires: rsvg-convert (brew install librsvg) OR sips (macOS built-in)
set -e
OUT="public"
mkdir -p "$OUT"

# Write SVG
cat > /tmp/dreamscape-icon.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#1a0a3a"/>
      <stop offset="100%" stop-color="#07070f"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <!-- Glow -->
  <ellipse cx="256" cy="230" rx="180" ry="160" fill="url(#glow)"/>
  <!-- Outer ring -->
  <circle cx="256" cy="256" r="170" fill="none" stroke="#a78bfa" stroke-width="1.5" opacity="0.3"/>
  <!-- Inner ring -->
  <circle cx="256" cy="256" r="120" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.2"/>
  <!-- Star symbol ✦ -->
  <text x="256" y="295" font-family="Georgia, serif" font-size="160" text-anchor="middle"
        fill="#a78bfa" opacity="0.95">✦</text>
  <!-- Small dots around ring -->
  <circle cx="256" cy="86" r="3" fill="#a78bfa" opacity="0.5"/>
  <circle cx="256" cy="426" r="3" fill="#a78bfa" opacity="0.5"/>
  <circle cx="86" cy="256" r="3" fill="#a78bfa" opacity="0.5"/>
  <circle cx="426" cy="256" r="3" fill="#a78bfa" opacity="0.5"/>
</svg>
SVG

# Try rsvg-convert first (best quality), fall back to sips
if command -v rsvg-convert &>/dev/null; then
  rsvg-convert -w 192 -h 192 /tmp/dreamscape-icon.svg -o "$OUT/icon-192.png"
  rsvg-convert -w 512 -h 512 /tmp/dreamscape-icon.svg -o "$OUT/icon-512.png"
  echo "✓ Icons generated via rsvg-convert"
elif command -v qlmanage &>/dev/null; then
  # macOS: convert via qlmanage thumbnail
  qlmanage -t -s 512 -o /tmp/ /tmp/dreamscape-icon.svg 2>/dev/null
  if [ -f /tmp/dreamscape-icon.svg.png ]; then
    sips -z 192 192 /tmp/dreamscape-icon.svg.png --out "$OUT/icon-192.png" &>/dev/null
    cp /tmp/dreamscape-icon.svg.png "$OUT/icon-512.png"
    echo "✓ Icons generated via sips"
  fi
else
  echo "⚠ Install librsvg for best results: brew install librsvg"
  echo "  Or generate icons manually from: /tmp/dreamscape-icon.svg"
fi

echo "Icons saved to $OUT/"
ls -lh "$OUT/icon-"*.png 2>/dev/null
