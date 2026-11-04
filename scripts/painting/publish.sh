#!/usr/bin/env bash
# Upload the painting library and the compressed videos to the private bucket
# path (readable only by PAINTING_VIEWERS in storage.hackertube.rules).
#
# Usage: scripts/painting/publish.sh [source-dir]
#   source-dir defaults to ~/Desktop/Patrick Okrasinski (holds compressed/).
#   Run scripts/painting/build-data.mjs first; it writes out/library.json.
#
# Videos already in the bucket are skipped (cp -n), so an interrupted run can
# simply be started again.
set -euo pipefail
src="${1:-$HOME/Desktop/Patrick Okrasinski}"
bucket=gs://franco-may.appspot.com
here="$(cd "$(dirname "$0")" && pwd)"
lib="$here/out/library.json"
[ -f "$lib" ] || { echo "run build-data.mjs first ($lib is missing)"; exit 1; }

# CORS is bucket-wide and already set by scripts/hackertube/publish.sh.
# Each line: <post id> <compressed file>
node -e '
const lib = require(process.argv[1]);
for (const p of Object.values(lib.posts)) console.log(p.id + "\t" + p.videoSource);
' "$lib" | while IFS=$'\t' read -r id rel; do
  file="$src/$rel"
  [ -f "$file" ] || { echo "missing $file"; exit 1; }
  echo "video $id"
  gsutil -h "Cache-Control:private, max-age=31536000" cp -n "$file" "$bucket/painting/videos/$id.mp4"
done

gsutil -h "Cache-Control:private, max-age=0" -h "Content-Type:application/json" \
  cp "$lib" "$bucket/painting/library.json"
