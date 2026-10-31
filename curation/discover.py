"""Automated discovery for channel lineups (M4 — replaces hand-picking).

For each channel rule below, searches YouTube for public videos matching
a tag/language/city query, pulls duration/embeddable-status/view-count,
applies a minimum view-count filter, and writes ../docs/data/videos.json.

Per the design doc there is no trusted-channel allow-list and no
per-video review: any channel whose public video matches a rule's
search query qualifies. A video is tagged with the language/city of
the query that first found it, not inferred from its text.

Usage:
    export YOUTUBE_API_KEY=...
    python discover.py
"""

import json
import os
import sys
import urllib.parse
import urllib.request

import fetch_metadata as fm  # reuses parse_duration, load_yaml_list, file paths

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
MIN_VIEWS = 1000
RESULTS_PER_QUERY = 25

# Per-channel rules. Each one becomes a search query of
# "<language> <city> <tag>" (city omitted when not set). Add more
# entries here to expand beyond the pilot Weddings channel.
RULES = [
    {"channel": "Weddings", "tag": "wedding", "language": "Tigrinya", "city": None},
    {"channel": "Weddings", "tag": "wedding", "language": "Eritrean", "city": None},
]


def build_query(rule):
    parts = [rule.get("language"), rule.get("city"), rule["tag"]]
    return " ".join(p for p in parts if p)


def search_videos(query, api_key):
    params = {
        "part": "id",
        "q": query,
        "type": "video",
        "maxResults": RESULTS_PER_QUERY,
        "key": api_key,
    }
    url = f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url) as response:
        payload = json.load(response)
    return [item["id"]["videoId"] for item in payload.get("items", [])]


def fetch_video_details(video_ids, api_key):
    results = {}
    for i in range(0, len(video_ids), 50):  # the API allows up to 50 IDs per call
        batch = video_ids[i : i + 50]
        params = {
            "part": "snippet,contentDetails,status,statistics",
            "id": ",".join(batch),
            "key": api_key,
        }
        url = f"{fm.API_URL}?{urllib.parse.urlencode(params)}"
        with urllib.request.urlopen(url) as response:
            payload = json.load(response)
        for item in payload.get("items", []):
            results[item["id"]] = item
    return results


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    blocked_ids = {entry["id"] for entry in fm.load_yaml_list(fm.BLOCKLIST_FILE)}

    # Run every rule's search, tagging each newly-seen video with the
    # rule that first found it and accumulating channel membership for
    # every rule that matches it.
    found_by = {}  # video_id -> rule dict (first match, used for tagging)
    channels_by_id = {}  # video_id -> set of channel names

    for rule in RULES:
        query = build_query(rule)
        for video_id in search_videos(query, api_key):
            if video_id in blocked_ids:
                continue
            found_by.setdefault(video_id, rule)
            channels_by_id.setdefault(video_id, set()).add(rule["channel"])

    video_ids = list(found_by.keys())
    details = fetch_video_details(video_ids, api_key)

    schedule_start = None
    if fm.OUTPUT_FILE.exists():
        with fm.OUTPUT_FILE.open() as f:
            existing = json.load(f)
        schedule_start = existing.get("scheduleStart")

    videos = []
    for video_id in video_ids:
        item = details.get(video_id)
        if item is None:
            print(f"Warning: {video_id} not found or not public, skipping.", file=sys.stderr)
            continue
        if item.get("status", {}).get("privacyStatus") != "public":
            continue
        if not item.get("status", {}).get("embeddable", False):
            continue
        view_count = int(item.get("statistics", {}).get("viewCount", 0))
        if view_count < MIN_VIEWS:
            continue

        rule = found_by[video_id]
        videos.append(
            {
                "id": video_id,
                "title": item["snippet"]["title"],
                "channel": item["snippet"]["channelTitle"],
                "language": rule.get("language", ""),
                "city": rule.get("city") or "",
                "tags": [rule["tag"]],
                "published": item["snippet"]["publishedAt"][:10],
                "duration": fm.parse_duration(item["contentDetails"]["duration"]),
                "channels": sorted(channels_by_id[video_id]),
                "notes": "",
            }
        )

    if schedule_start is None:
        import datetime

        schedule_start = datetime.datetime.now(datetime.timezone.utc).isoformat()

    fm.OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with fm.OUTPUT_FILE.open("w") as f:
        json.dump({"scheduleStart": schedule_start, "videos": videos}, f, indent=2)
        f.write("\n")

    print(f"Wrote {len(videos)} videos to {fm.OUTPUT_FILE}")


if __name__ == "__main__":
    main()
