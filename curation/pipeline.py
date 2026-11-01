"""Shared search/validation/merge helpers for the curation pipeline.

Used by discover.py, kebire_channel.py, and fetch_metadata.py. This module
owns everything that's common across channel scripts: fetching video
metadata from the YouTube Data API, deciding whether a video still
qualifies for its channel (validate_record — a pure function, no API
calls), orchestrating a full per-channel run that re-checks both
already-stored videos and freshly-discovered candidates (compute_run),
merging the result into docs/data/videos.json (write_channel_result), and
handing off a machine-readable summary of what changed to the GitHub
Actions workflow (write_run_summary).

Design note: removals (a video failing validate_record) and additions
(a new video passing it) are kept as separate lists throughout, because
the workflow treats them differently — removals are safe to apply
immediately (same-day takedown response), additions go through a PR for a
quick human glance.
"""

import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CHANNELS_FILE = ROOT / "curation" / "channels.yaml"
JOBS_FILE = ROOT / "curation" / "jobs.yaml"
OUTPUT_FILE = ROOT / "docs" / "data" / "videos.json"
PENDING_DIR = ROOT / "curation" / ".pending"

API_URL = "https://www.googleapis.com/youtube/v3/videos"
DURATION_RE = re.compile(
    r"PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?"
)


def parse_duration(iso8601):
    match = DURATION_RE.fullmatch(iso8601)
    if not match:
        raise ValueError(f"Unrecognized duration format: {iso8601}")
    parts = match.groupdict(default="0")
    return int(parts["hours"]) * 3600 + int(parts["minutes"]) * 60 + int(parts["seconds"])


def load_yaml_list(path):
    path = Path(path)
    if not path.exists():
        return []
    with path.open() as f:
        return yaml.safe_load(f) or []


def load_channels_config(path=CHANNELS_FILE):
    """Parse channels.yaml, return {channel_key: {type, display_name, ...}}."""
    with Path(path).open() as f:
        return yaml.safe_load(f) or {}


def load_jobs_list(path=JOBS_FILE):
    """Parse jobs.yaml, return the list of script filenames."""
    with Path(path).open() as f:
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


def write_output(data):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def fetch_video_metadata(video_ids, api_key):
    """Batch-call videos.list for the given IDs (up to 50 per call).

    Returns a dict keyed by video ID: title, channel (channelTitle),
    description, published (YYYY-MM-DD), duration (seconds), public
    (status.privacyStatus == "public"), embeddable (status.embeddable),
    view_count (statistics.viewCount, 0 if missing/disabled). An ID the
    API doesn't return (deleted/never existed) is simply absent from the
    result — callers must treat a missing key as "gone".
    """
    results = {}
    video_ids = list(video_ids)
    for i in range(0, len(video_ids), 50):  # the API allows up to 50 IDs per call
        batch = video_ids[i : i + 50]
        if not batch:
            continue
        params = {
            "part": "snippet,contentDetails,status,statistics",
            "id": ",".join(batch),
            "key": api_key,
        }
        url = f"{API_URL}?{urllib.parse.urlencode(params)}"
        with urllib.request.urlopen(url) as response:
            payload = json.load(response)
        for item in payload.get("items", []):
            snippet = item.get("snippet", {})
            status = item.get("status", {})
            stats = item.get("statistics", {})
            results[item["id"]] = {
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", ""),
                "published": snippet.get("publishedAt", "")[:10],
                "duration": parse_duration(item["contentDetails"]["duration"]),
                "public": status.get("privacyStatus") == "public",
                "embeddable": status.get("embeddable", False),
                "view_count": int(stats.get("viewCount", 0)),
            }
    return results


def validate_record(record, rules):
    """Pure function — no API calls, no I/O.

    `record` is one value from fetch_video_metadata()'s result (or the
    sentinel {"missing": True} if the ID wasn't returned at all). `rules`
    is one channel's channels.yaml entry (view_count_min, duration_min_sec).

    Returns (True, None) if the record passes every check, else
    (False, reason) with reason one of: "removed", "private",
    "not embeddable", "too short", "too few views". Check order matches
    that list.
    """
    if record.get("missing"):
        return False, "removed"
    if not record.get("public"):
        return False, "private"
    if not record.get("embeddable"):
        return False, "not embeddable"
    if record.get("duration", 0) < rules.get("duration_min_sec", 0):
        return False, "too short"
    if record.get("view_count", 0) < rules.get("view_count_min", 0):
        return False, "too few views"
    return True, None


def compute_run(
    channel_key,
    display_name,
    stored_videos,
    fresh_candidate_ids,
    rules,
    api_key,
    blocked_ids,
    fetch_fn=fetch_video_metadata,
):
    """Orchestrate one full channel run.

    1. Re-validate every video already in stored_videos: a blocklisted ID
       fails immediately (reason "blocklisted", no API call needed); every
       other ID gets fresh metadata and goes through validate_record. A
       video that still passes keeps its existing language/city/tags/
       channels/notes but refreshes title/channel/duration and stamps
       lastValidated = now (UTC ISO). One that fails goes into removals.
    2. Validate fresh_candidate_ids (skipping any already in
       stored_videos): a blocklisted candidate is dropped the same as a
       failing one — it never existed in the pool, so it's not a
       "removal". A candidate that passes becomes a new video record.
    3. Return {"final_videos": [...], "additions": [...], "removals": [...]}.

    `fetch_fn` is injectable for testing (defaults to the real
    fetch_video_metadata); callers in discover.py/kebire_channel.py should
    not pass it.
    """
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    stored_ids = [v["id"] for v in stored_videos]
    ids_to_refetch = [vid for vid in stored_ids if vid not in blocked_ids]
    stored_metadata = fetch_fn(ids_to_refetch, api_key) if ids_to_refetch else {}

    kept_videos = []
    removals = []
    for v in stored_videos:
        vid = v["id"]
        if vid in blocked_ids:
            removals.append({"id": vid, "title": v.get("title", ""), "reason": "blocklisted"})
            continue
        record = stored_metadata.get(vid, {"missing": True})
        ok, reason = validate_record(record, rules)
        if ok:
            updated = dict(v)
            updated["title"] = record["title"]
            updated["channel"] = record["channel"]
            updated["duration"] = record["duration"]
            updated["lastValidated"] = now
            kept_videos.append(updated)
        else:
            removals.append({"id": vid, "title": v.get("title", ""), "reason": reason})

    stored_id_set = set(stored_ids)
    new_candidate_ids = [
        cid for cid in fresh_candidate_ids if cid not in stored_id_set and cid not in blocked_ids
    ]
    candidate_metadata = fetch_fn(new_candidate_ids, api_key) if new_candidate_ids else {}

    additions = []
    for cid in new_candidate_ids:
        record = candidate_metadata.get(cid, {"missing": True})
        ok, _reason = validate_record(record, rules)
        if not ok:
            continue  # dropped silently — never existed in the pool, not a removal
        additions.append(
            {
                "id": cid,
                "title": record["title"],
                "channel": record["channel"],
                "language": "",
                "city": "",
                "tags": [],
                "published": record["published"],
                "duration": record["duration"],
                "channels": [display_name],
                "notes": "",
                "lastValidated": now,
            }
        )

    return {
        "final_videos": kept_videos + additions,
        "additions": additions,
        "removals": removals,
    }


def write_channel_result(existing_data, channel_key_display_name, final_videos, is_default):
    """Replace channel_key_display_name's entries in existing_data["videos"]
    with final_videos (every other channel's entries pass through
    untouched), and ensure existing_data["schedules"][channel_key_display_name]
    exists. A channel's scheduleStart (and default flag) is set once, on
    first creation, and never modified on later runs — only the video list
    is refreshed. Unlike the old merge_channel(), this takes the final
    already-computed video list directly rather than fetching anything
    itself.
    """
    kept = [
        v for v in existing_data.get("videos", []) if v.get("channels") != [channel_key_display_name]
    ]
    kept.extend(final_videos)
    existing_data["videos"] = kept

    schedules = existing_data.setdefault("schedules", {})
    if channel_key_display_name not in schedules:
        entry = {"scheduleStart": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if is_default:
            entry["default"] = True
        schedules[channel_key_display_name] = entry
    # else: this channel's schedule entry already exists — leave its
    # scheduleStart and default value exactly as they are.

    return existing_data


def write_run_summary(channel_key, additions, removals, out_dir="curation/.pending"):
    """Write {out_dir}/{channel_key}.json: {"channel", "additions", "removals"}.

    This directory is transient hand-off to the GitHub Actions workflow,
    not committed data — see .gitignore.
    """
    target_dir = PENDING_DIR if out_dir == "curation/.pending" else Path(out_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / f"{channel_key}.json"
    with path.open("w") as f:
        json.dump({"channel": channel_key, "additions": additions, "removals": removals}, f, indent=2)
        f.write("\n")
