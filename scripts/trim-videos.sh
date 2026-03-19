#!/bin/bash
# Trims Playwright video recordings to 7 seconds and converts to H.264 MP4
# Run after: npx playwright test --project=video-iphone

set -e

PLAYWRIGHT_RESULTS="test-results"
OUT="tests/videos/final"
mkdir -p "$OUT"

echo "🎬 Looking for Playwright video recordings..."

# Playwright saves videos in test-results/{test-name}-{project}/video.webm
find "$PLAYWRIGHT_RESULTS" -name "*.webm" | while read -r webm; do
  # Extract test name from directory path
  dirname=$(basename "$(dirname "$webm")")
  # Clean name: remove trailing project/hash info
  name=$(echo "$dirname" | sed 's/-video-iphone.*//' | sed 's/demo-//')

  output="$OUT/${name}.mp4"

  echo "  ✦ $name → ${output}"
  ffmpeg -y \
    -i "$webm" \
    -t 7 \
    -vf "scale=393:852:force_original_aspect_ratio=decrease,pad=393:852:(ow-iw)/2:(oh-ih)/2:black" \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$output" 2>/dev/null && echo "    ✓ Done" || echo "    ✗ Failed (check ffmpeg)"
done

echo ""
echo "Videos saved to: $OUT/"
ls -lh "$OUT/" 2>/dev/null || echo "(no output yet)"
