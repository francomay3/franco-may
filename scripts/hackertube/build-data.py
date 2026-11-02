"""Merge the HackerTube export and the YouTube metadata into the two files the
/hackertube page downloads from Storage.

Usage: python3 scripts/hackertube/build-data.py <source-dir> <out-dir>

<source-dir> holds videos.jsonl, taxonomy.json, embeddings.npy,
embedding_ids.json and youtube_meta.jsonl. The outputs are NOT committed:
they carry YouTube API data, which may not be redistributed, so they go to a
private bucket path (see scripts/hackertube/publish.sh).

  videos.json   {taxonomy, videos[]} -- only what the page shows or filters on.
                YouTube descriptions are deliberately left out (large, unused).
  related.json  {videoId: [[otherId, sharedRecommenders], ...]}, the videos
                recommended by at least two of the same HN commenters.
  embeddings.i8 int8, row i = videos[i], 384 values per row. The source vectors
                are L2-normalised, so value * 127 loses nothing the ranking
                can see, and the file is 2.5 MB instead of 5.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np

src, out = Path(sys.argv[1]), Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)

DURATION = re.compile(
    r"^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$"
)


def seconds(iso: str) -> int:
    m = DURATION.match(iso)
    d, h, mi, s = (int(x or 0) for x in m.groups()) if m else (0, 0, 0, 0)
    return d * 86400 + h * 3600 + mi * 60 + s


meta = {}
for line in open(src / "youtube_meta.jsonl"):
    row = json.loads(line)
    meta[row["vid"]] = row["item"]

taxonomy = json.load(open(src / "taxonomy.json"))
areas = [
    {
        "id": a["id"],
        "name": a["name"],
        "categories": [{"id": c["id"], "name": c["name"]} for c in a["categories"]],
    }
    for a in taxonomy["areas"]
]

videos = []
for line in open(src / "videos.jsonl"):
    v = json.loads(line)
    item = meta.get(v["vid"])
    yt = item or {}
    sn, cd, st = yt.get("snippet", {}), yt.get("contentDetails", {}), yt.get("statistics", {})
    num = lambda x: int(x) if x is not None else None
    videos.append(
        {
            "id": v["vid"],
            "title": v["title"],
            "channel": v["channel"],
            "channelId": sn.get("channelId"),
            "summary": v["summary"],
            "whyHn": v["why_hn"],
            "type": v["content_type"],
            "shelfLife": v["shelf_life"],
            "tags": v["tags"],
            "cats": [c["id"] for c in v["categories"]],
            "score": v["score"],
            "recommenders": v["hn"]["recommenders"],
            "published": sn.get("publishedAt", "")[:10] or None,
            "duration": seconds(cd["duration"]) if cd.get("duration") else None,
            "views": num(st.get("viewCount")),
            "likes": num(st.get("likeCount")),
            "embeddable": yt.get("status", {}).get("embeddable"),
            "gone": item is None,
        }
    )

(out / "videos.json").write_text(
    json.dumps({"taxonomy": areas, "videos": videos}, separators=(",", ":"))
)

# Videos recommended by the same HN commenters. Kept only where both ends are
# in the dataset and at least two different commenters recommended both: 99%
# of the raw pairs come from a single shared commenter, which is one person who
# happened to like both and says nothing about the videos. That leaves about 3%
# of videos with any, and those are real links.
MIN_SHARED = 2
known = {v["id"] for v in videos}
related = {}
for line in open(src / "related.jsonl"):
    r = json.loads(line)
    pairs = [
        [x["vid"], x["shared_recommenders"]]
        for x in r["related"]
        if x["vid"] in known
        and x["vid"] != r["vid"]
        and x["shared_recommenders"] >= MIN_SHARED
    ][:12]
    if r["vid"] in known and pairs:
        related[r["vid"]] = pairs
(out / "related.json").write_text(json.dumps(related, separators=(",", ":")))

emb = np.load(src / "embeddings.npy").astype(np.float32)
row = {vid: i for i, vid in enumerate(json.load(open(src / "embedding_ids.json")))}
ordered = emb[[row[v["id"]] for v in videos]]
q = np.clip(np.round(ordered * 127), -127, 127).astype(np.int8)
(out / "embeddings.i8").write_bytes(q.tobytes())

print(f"{len(videos)} videos, {sum(v['gone'] for v in videos)} gone, emb {q.shape}, related for {len(related)}")
