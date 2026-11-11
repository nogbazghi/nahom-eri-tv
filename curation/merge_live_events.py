"""Merge manually-submitted Live event entries into docs/data/videos.json.

Reads curation/live_events.yaml (hand-edited, PR-reviewed entries naming a
source video id, display name, and scheduled start time) and writes a
top-level `liveEvents` array into ../docs/data/videos.json — leaving the
existing `videos`/`schedules` structure untouched.

Unlike discover.py/kebire_channel.py, this never runs as part of the
automated weekly job (see jobs.yaml). Live events are deliberately kept
outside the search/validate pipeline — a not-yet-happened live stream has
no view count or duration to validate against — so every submission goes
through ordinary PR review of live_events.yaml instead.

Usage:
    export YOUTUBE_API_KEY=...
    python merge_live_events.py
"""

import datetime
import os
import sys
from pathlib import Path

from pipeline import fetch_video_metadata, load_existing, load_yaml_list, write_output

ROOT = Path(__file__).resolve().parent.parent
LIVE_EVENTS_FILE = ROOT / "curation" / "live_events.yaml"
OUTPUT_FILE = ROOT / "docs" / "data" / "videos.json"

DEFAULT_LEAD_TIME_HOURS = 2
DEFAULT_EXPIRE_AFTER_HOURS = 24

REQUIRED_FIELDS = ("id", "display_name", "scheduled_start")


def validate_entry(entry):
    """Returns an error string describing why `entry` is malformed, or None
    if it's well-formed. Checked here rather than left to fail downstream:
    a missing required field or an unparseable scheduled_start must be
    rejected with a clear reason, never silently written."""
    missing = [field for field in REQUIRED_FIELDS if not entry.get(field)]
    if missing:
        return f"missing required field(s) {missing}: {entry!r}"
    try:
        datetime.datetime.fromisoformat(str(entry["scheduled_start"]))
    except ValueError:
        return f"unparseable scheduled_start {entry['scheduled_start']!r}: {entry!r}"
    return None


def build_live_event(entry, metadata):
    return {
        "id": entry["id"],
        "title": metadata["title"],
        "channel": metadata["channel"],
        "displayName": entry["display_name"],
        # str(): a maintainer who forgets to quote scheduled_start in YAML
        # gets a real datetime back from PyYAML's safe_load, which
        # json.dump (write_output) can't serialize.
        "scheduledStart": str(entry["scheduled_start"]),
        "leadTimeHours": entry.get("lead_time_hours", DEFAULT_LEAD_TIME_HOURS),
        "expireAfterHours": entry.get("expire_after_hours", DEFAULT_EXPIRE_AFTER_HOURS),
    }


def compute_live_events(entries, *, api_key, fetch_fn=fetch_video_metadata):
    """Validate and merge live_events.yaml entries into liveEvents records.

    Returns (live_events, errors): live_events are the records to write (in
    entries order, malformed ones excluded), errors is one human-readable
    rejection reason per malformed or not-found entry. A malformed entry
    never reaches fetch_fn — only entries that pass validate_entry get
    their video id looked up.
    """
    valid_entries = []
    errors = []
    for entry in entries:
        reason = validate_entry(entry)
        if reason is None:
            valid_entries.append(entry)
        else:
            errors.append(reason)

    video_ids = [entry["id"] for entry in valid_entries]
    metadata_by_id = fetch_fn(video_ids, api_key) if video_ids else {}

    live_events = []
    for entry in valid_entries:
        metadata = metadata_by_id.get(entry["id"], {"missing": True})
        if metadata.get("missing"):
            errors.append(f"video {entry['id']!r} not found")
            continue
        live_events.append(build_live_event(entry, metadata))

    return live_events, errors


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    entries = load_yaml_list(LIVE_EVENTS_FILE)
    if not entries:
        print(f"No entries found in {LIVE_EVENTS_FILE}; nothing to do.")
        return

    live_events, errors = compute_live_events(entries, api_key=api_key)
    for reason in errors:
        print(f"Warning: rejected live event — {reason}", file=sys.stderr)

    existing = load_existing()
    existing["liveEvents"] = live_events
    write_output(existing)

    print(f"Wrote {len(live_events)} Live event(s) to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
