"""Automated discovery for "channel"-type sources in channels.yaml.

Unlike discover.py's search-query rule, this rule type is "everything
this one creator publicly posted" filtered by a text match, not a
keyword search across many channels:

    public, embeddable videos from a known creator's channel whose
    title or description contains a configured text_filter

No trusted-channel vetting is relevant here (each entry names its own
single source channel), and view_count_min is typically 0 — that filter
exists to de-risk an unvetted pool of strangers in discover.py, which
doesn't apply to one known creator's own catalog.

Every `type: channel` entry in channels.yaml is processed — this script
is not hardcoded to any one creator (e.g. Kebire). Adding a second
channel-type source is a channels.yaml edit, not a code change.

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

import pipeline  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
BLOCKLIST_FILE = ROOT / "curation" / "blocklist.yaml"

CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels"
PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"


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


def resolve_playlist_id(entry, api_key, get_uploads_playlist_id=get_uploads_playlist_id):
    """Pick the playlist to enumerate for a `type: channel` entry.

    An explicit `playlist_id` is used as-is, so a channel can point
    directly at one of its own curated playlists (e.g. Eri-TV's news or
    sports playlist) instead of its whole uploads history. With no
    `playlist_id` configured, falls back to deriving the channel's
    uploads playlist from `channel_id` — today's only behavior, and
    Kebire's existing entry takes this path unchanged.

    `get_uploads_playlist_id` is injectable for testing (defaults to the
    real one); callers in run_channel() should not pass it.
    """
    playlist_id = entry.get("playlist_id")
    if playlist_id:
        return playlist_id
    return get_uploads_playlist_id(entry["channel_id"], api_key)


def matches_text_filter(title, description, text_filter):
    """Pure — case-insensitive substring match against title OR description.

    Relevance matching, not quality validation: this runs BEFORE
    pipeline.validate_record, which knows nothing about text_filter.
    """
    if not text_filter:
        return True
    needle = text_filter.lower()
    return needle in (title or "").lower() or needle in (description or "").lower()


def tag_for(text_filter):
    """'#eritrea' -> 'eritrea'; '' -> ''. Generic, not hardcoded to any
    one channel's filter text."""
    return text_filter.lstrip("#").lower() if text_filter else ""


def run_channel(channel_key, entry, api_key, blocked_ids, existing_data):
    display_name = entry["display_name"]
    text_filter = entry.get("text_filter", "")

    playlist_id = resolve_playlist_id(entry, api_key)
    all_video_ids = get_all_video_ids(playlist_id, api_key)

    stored_videos = pipeline.videos_for_channel(existing_data, display_name, channel_key)
    stored_ids = {v["id"] for v in stored_videos}

    fresh_ids = pipeline.filter_new_ids(all_video_ids, stored_ids, blocked_ids)

    # Need title/description to apply text_filter, so fetch metadata for
    # fresh IDs up front. compute_run() will fetch it again internally for
    # the IDs that pass this filter, to run full validation — a small,
    # acceptable duplication given how cheap videos.list batches are.
    metadata = pipeline.fetch_video_metadata(fresh_ids, api_key) if fresh_ids else {}
    candidate_ids = [
        vid
        for vid in fresh_ids
        if vid in metadata
        and matches_text_filter(metadata[vid]["title"], metadata[vid]["description"], text_filter)
    ]

    rules = pipeline.rules_from_config(entry)
    result = pipeline.compute_run(
        channel_key, display_name, stored_videos, candidate_ids, rules, api_key, blocked_ids,
    )

    tag = tag_for(text_filter)
    if tag:
        for v in result["additions"]:
            v["tags"] = [tag]

    updated = pipeline.write_channel_result(
        existing_data,
        display_name,
        channel_key,
        result["final_videos"],
        entry.get("is_default", False),
    )
    pipeline.write_run_summary(channel_key, result["additions"], result["removals"])
    print(
        f"{display_name}: {len(result['additions'])} added, "
        f"{len(result['removals'])} removed, {len(result['final_videos'])} total"
    )
    return updated


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    channels_config = pipeline.load_channels_config()
    channel_entries = {k: v for k, v in channels_config.items() if v.get("type") == "channel"}
    if not channel_entries:
        print("No type=channel entries in channels.yaml; nothing to do.")
        return

    blocked_ids = {entry["id"] for entry in pipeline.load_yaml_list(BLOCKLIST_FILE)}
    existing_data = pipeline.load_existing()

    for channel_key, entry in channel_entries.items():
        existing_data = run_channel(channel_key, entry, api_key, blocked_ids, existing_data)

    pipeline.write_output(existing_data)


if __name__ == "__main__":
    main()
