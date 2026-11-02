"""Fetch metadata for the pilot's hand-picked wedding videos.

Reads seed_videos.yaml (hand-picked video IDs plus hand-entered
language/city/channels) and blocklist.yaml (excluded IDs), calls the
YouTube Data API for title/duration/embeddable status, and merges the
result into the "Weddings" channel of ../docs/data/videos.json.

../docs/data/videos.json holds a flat pool of videos (each tagged with
a `channels` array) plus a `schedules` map of one entry per channel
(`scheduleStart`, and `default: true` on exactly one channel). Each
channel's `scheduleStart` is set once, the first time that channel is
generated, and preserved on every later run — this script only ever
replaces the "Weddings"-tagged videos, leaving every other channel's
entries and schedule untouched.

The shared search/validate/merge helpers (parse_duration, YAML loading,
reading/writing docs/data/videos.json, merging one channel's result into
it) live in pipeline.py — discover.py and kebire_channel.py are peers of
this script, not consumers of it.

Usage:
    export YOUTUBE_API_KEY=...
    python fetch_metadata.py
"""

import os
import sys
from pathlib import Path

from pipeline import (
    fetch_video_metadata,
    load_existing,
    load_yaml_list,
    write_channel_result,
    write_output,
)

ROOT = Path(__file__).resolve().parent.parent
SEED_FILE = ROOT / "curation" / "seed_videos.yaml"
BLOCKLIST_FILE = ROOT / "curation" / "blocklist.yaml"
OUTPUT_FILE = ROOT / "docs" / "data" / "videos.json"

CHANNEL_NAME = "Weddings"
IS_DEFAULT_CHANNEL = True


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    seeds = load_yaml_list(SEED_FILE)
    if not seeds:
        sys.exit(f"No entries found in {SEED_FILE}. Add a few video IDs first.")

    blocked_ids = {entry["id"] for entry in load_yaml_list(BLOCKLIST_FILE)}

    video_ids = [seed["id"] for seed in seeds if seed["id"] not in blocked_ids]
    api_data = fetch_video_metadata(video_ids, api_key)

    videos = []
    for seed in seeds:
        video_id = seed["id"]
        if video_id in blocked_ids:
            continue
        item = api_data.get(video_id)
        if item is None:
            print(f"Warning: {video_id} not found or not public, skipping.", file=sys.stderr)
            continue
        if not item.get("embeddable", False):
            print(f"Warning: {video_id} is not embeddable, skipping.", file=sys.stderr)
            continue

        videos.append(
            {
                "id": video_id,
                "title": item["title"],
                "channel": item["channel"],
                "language": seed.get("language", ""),
                "city": seed.get("city", ""),
                "tags": seed.get("tags", []),
                "published": item["published"],
                "duration": item["duration"],
                "channels": seed.get("channels", []),
                "notes": seed.get("notes", ""),
            }
        )

    existing = load_existing()
    merged = write_channel_result(existing, CHANNEL_NAME, videos, is_default=IS_DEFAULT_CHANNEL)
    write_output(merged)

    print(f"Wrote {len(videos)} videos to the '{CHANNEL_NAME}' channel in {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
