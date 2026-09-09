#!/usr/bin/env bash
# Pack assets/fornlamningar-icons/*.svg into the MapLibre sprite the map loads.
#
# Two files per ratio: icons.png + icons.json at 1x, icons@2x.* at 2x. MapLibre
# picks by devicePixelRatio and appends the "@2x" itself, so the style URL stays
# `/fornlamningar-icons/icons` with no extension.
#
# The sprite this replaces had 1x logical 64 px but 2x logical 128 px, so the
# same icon came out twice the size on a retina screen. Both ratios here are
# generated from the same 64 px SVGs, which keeps the logical size at 64
# everywhere.
#
# Needs: brew install spreet
set -euo pipefail
SRC="assets/fornlamningar-icons"
DST="public/fornlamningar-icons"

command -v spreet >/dev/null || { echo "spreet not found (brew install spreet)" >&2; exit 1; }
[[ -d "$SRC" ]] || { echo "no $SRC -- run: python3 scripts/build_icons.py" >&2; exit 1; }

mkdir -p "$DST"
spreet "$SRC" "$DST/icons"
spreet --retina "$SRC" "$DST/icons@2x"

python3 - "$DST" <<'PY'
import json, sys, os
d = sys.argv[1]
for f, want in (("icons.json", 1), ("icons@2x.json", 2)):
    idx = json.load(open(os.path.join(d, f)))
    ratios = {v["pixelRatio"] for v in idx.values()}
    logical = {v["width"] // v["pixelRatio"] for v in idx.values()}
    png = os.path.join(d, f.replace(".json", ".png"))
    print(f"  {f:16} {len(idx):3} icons  pixelRatio={ratios}  "
          f"logical={logical}  {os.path.getsize(png)/1024:.0f} KB")
    assert ratios == {want}, f"{f}: expected pixelRatio {want}, got {ratios}"
    assert logical == {64}, f"{f}: logical size drifted: {logical}"
PY
