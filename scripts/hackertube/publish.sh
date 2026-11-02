#!/usr/bin/env bash
# Upload the built data files to the private bucket path and set CORS.
# Usage: scripts/hackertube/publish.sh <out-dir from build-data.py>
set -euo pipefail
dir="${1:?out dir}"
bucket=gs://franco-may.appspot.com
here="$(cd "$(dirname "$0")" && pwd)"

gsutil cors set "$here/bucket-cors.json" "$bucket"
gsutil -h "Cache-Control:private, max-age=0" cp \
  "$dir/videos.json" "$dir/embeddings.i8" "$bucket/hackertube/"
