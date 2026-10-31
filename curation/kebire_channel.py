"""Automated discovery for the Kebire channel.

Unlike discover.py's search-query rule, this channel's rule is
"everything this one creator publicly posted" filtered by a hashtag,
not a keyword search across many channels:

    public, embeddable videos from Kebire's YouTube channel whose
    title or description contains "#eritrea" (case-insensitive)

No trusted-channel vetting is relevant here (there's only one source
channel), and no view-count minimum is applied — that filter exists to
de-risk an unvetted pool of strangers in discover.py, which doesn't
apply to one known creator's own catalog.

Usage:
    export YOUTUBE_API_KEY=...
    python kebire_channel.py             # from curation/
    python curation/kebire_channel.py    # from the repo root
"""

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import fetch_metadata as fm  # noqa: E402  (reuses parse_duration, load_yaml_list, merge helpers)

CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"

CHANNEL_NAME = "Kebire"
HASHTAG = "#eritrea"

# Resolved once via videos.list(id=un4pHBAkIag).snippet.channelId — the
# video that prompted this feature:
# https://www.youtube.com/watch?v=un4pHBAkIag
KEBIRE_CHANNEL_ID = "UCz9a7XA9oMmk3CpFnE456bQ"


def get_uploads_playlist_id(channel_id, api_key):
    params = {"part": "contentDetails", "id": channel_id, "key": api_key}
    url = f"{CHANNELS_URL}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url) as response:
        payload = json.load(response)
    items = payload.get("items", [])
    if not items:
        sys.exit(f"No channel found for id {channel_id}")
    return items[0]["contentDetails"]["relatedPlaylists"]["uploads"]


def get_all_video_ids(playlist_id, api_key):
    video_ids = []
    page_token = None
    while True:
        params = {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": 50,
            "key": api_key,
        }
        if page_token:
            params["pageToken"] = page_token
        url = f"{PLAYLIST_ITEMS_URL}?{urllib.parse.urlencode(params)}"
        with urllib.request.urlopen(url) as response:
            payload = json.load(response)
        video_ids.extend(item["contentDetails"]["videoId"] for item in payload.get("items", []))
        page_token = payload.get("nextPageToken")
        if not page_token:
            break
    return video_ids


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    blocked_ids = {entry["id"] for entry in fm.load_yaml_list(fm.BLOCKLIST_FILE)}

    uploads_playlist_id = get_uploads_playlist_id(KEBIRE_CHANNEL_ID, api_key)
    all_video_ids = get_all_video_ids(uploads_playlist_id, api_key)
    candidate_ids = [vid for vid in all_video_ids if vid not in blocked_ids]

    details = fm.fetch_video_data(candidate_ids, api_key)

    videos = []
    for video_id in candidate_ids:
        item = details.get(video_id)
        if item is None:
            continue
        if item.get("status", {}).get("privacyStatus") != "public":
            continue
        if not item.get("status", {}).get("embeddable", False):
            continue

        title = item["snippet"].get("title", "")
        description = item["snippet"].get("description", "")
        if HASHTAG not in title.lower() and HASHTAG not in description.lower():
            continue

        videos.append(
            {
                "id": video_id,
                "title": title,
                "channel": item["snippet"]["channelTitle"],
                "language": "",
                "city": "",
                "tags": ["eritrea"],
                "published": item["snippet"]["publishedAt"][:10],
                "duration": fm.parse_duration(item["contentDetails"]["duration"]),
                "channels": [CHANNEL_NAME],
                "notes": "",
            }
        )

    existing = fm.load_existing()
    merged = fm.merge_channel(existing, CHANNEL_NAME, videos, is_default=False)
    fm.write_output(merged)

    print(f"Wrote {len(videos)} videos to the '{CHANNEL_NAME}' channel in {fm.OUTPUT_FILE}")


if __name__ == "__main__":
    main()
