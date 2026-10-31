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
entries and schedule untouched. See `merge_channel` below; discover.py
and kebire_channel.py reuse it for their own channels.

Usage:
    export YOUTUBE_API_KEY=...
    python fetch_metadata.py
"""

import datetime
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
SEED_FILE = ROOT / "curation" / "seed_videos.yaml"
BLOCKLIST_FILE = ROOT / "curation" / "blocklist.yaml"
OUTPUT_FILE = ROOT / "docs" / "data" / "videos.json"

API_URL = "https://www.googleapis.com/youtube/v3/videos"
DURATION_RE = re.compile(
    r"PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?"
)

CHANNEL_NAME = "Weddings"
IS_DEFAULT_CHANNEL = True


def parse_duration(iso8601):
    match = DURATION_RE.fullmatch(iso8601)
    if not match:
        raise ValueError(f"Unrecognized duration format: {iso8601}")
    parts = match.groupdict(default="0")
    return int(parts["hours"]) * 3600 + int(parts["minutes"]) * 60 + int(parts["seconds"])


def load_yaml_list(path):
    if not path.exists():
        return []
    with path.open() as f:
        return yaml.safe_load(f) or []


def load_existing():
    """Read docs/data/videos.json, or a fresh empty structure if it
    doesn't exist yet."""
    if OUTPUT_FILE.exists():
        with OUTPUT_FILE.open() as f:
            data = json.load(f)
        data.setdefault("videos", [])
        data.setdefault("schedules", {})
        return data
    return {"videos": [], "schedules": {}}


def merge_channel(existing, channel_name, new_videos, is_default=False):
    """Replace `channel_name`'s entries in existing["videos"] with
    new_videos (every other channel's entries pass through untouched),
    and ensure existing["schedules"][channel_name] exists. A channel's
    scheduleStart (and default flag) is set once, on first creation,
    and never modified on later runs — only the video list is
    refreshed."""
    kept = [v for v in existing["videos"] if v.get("channels") != [channel_name]]
    kept.extend(new_videos)
    existing["videos"] = kept

    schedules = existing.setdefault("schedules", {})
    if channel_name not in schedules:
        entry = {"scheduleStart": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if is_default:
            entry["default"] = True
        schedules[channel_name] = entry
    # else: this channel's schedule entry already exists — leave its
    # scheduleStart and default value exactly as they are.

    return existing


def write_output(data):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def fetch_video_data(video_ids, api_key):
    results = {}
    for i in range(0, len(video_ids), 50):  # the API allows up to 50 IDs per call
        batch = video_ids[i : i + 50]
        params = {
            "part": "snippet,contentDetails,status",
            "id": ",".join(batch),
            "key": api_key,
        }
        url = f"{API_URL}?{urllib.parse.urlencode(params)}"
        with urllib.request.urlopen(url) as response:
            payload = json.load(response)
        for item in payload.get("items", []):
            results[item["id"]] = item
    return results


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    seeds = load_yaml_list(SEED_FILE)
    if not seeds:
        sys.exit(f"No entries found in {SEED_FILE}. Add a few video IDs first.")

    blocked_ids = {entry["id"] for entry in load_yaml_list(BLOCKLIST_FILE)}

    video_ids = [seed["id"] for seed in seeds if seed["id"] not in blocked_ids]
    api_data = fetch_video_data(video_ids, api_key)

    videos = []
    for seed in seeds:
        video_id = seed["id"]
        if video_id in blocked_ids:
            continue
        item = api_data.get(video_id)
        if item is None:
            print(f"Warning: {video_id} not found or not public, skipping.", file=sys.stderr)
            continue
        if not item.get("status", {}).get("embeddable", False):
            print(f"Warning: {video_id} is not embeddable, skipping.", file=sys.stderr)
            continue

        videos.append(
            {
                "id": video_id,
                "title": item["snippet"]["title"],
                "channel": item["snippet"]["channelTitle"],
                "language": seed.get("language", ""),
                "city": seed.get("city", ""),
                "tags": seed.get("tags", []),
                "published": item["snippet"]["publishedAt"][:10],
                "duration": parse_duration(item["contentDetails"]["duration"]),
                "channels": seed.get("channels", []),
                "notes": seed.get("notes", ""),
            }
        )

    existing = load_existing()
    merged = merge_channel(existing, CHANNEL_NAME, videos, is_default=IS_DEFAULT_CHANNEL)
    write_output(merged)

    print(f"Wrote {len(videos)} videos to the '{CHANNEL_NAME}' channel in {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
