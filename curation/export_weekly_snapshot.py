"""Weekly export: reads this week's per-channel watch counts from the
Cloudflare Worker's KV store (ticket #114) and writes a committed JSON
snapshot under curation/viewership/ — never under docs/, so it's never
served as part of the live GitHub Pages site (ticket #116, part of #113).

Usage:
    export CF_ACCOUNT_ID=...
    export CF_KV_NAMESPACE_ID=...
    export CF_API_TOKEN=...
    python export_weekly_snapshot.py            # from curation/
    python curation/export_weekly_snapshot.py   # from the repo root
"""

import datetime
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pipeline  # noqa: E402

OUTPUT_DIR = Path(__file__).resolve().parent / "viewership"

KV_READ_URL = (
    "https://api.cloudflare.com/client/v4/accounts/{account_id}"
    "/storage/kv/namespaces/{namespace_id}/values/{key}"
)


def iso_week_key(date):
    """The same ISO 8601 (year, week) key worker/watch-counter.js's
    isoWeekKey() computes — Python's date.isocalendar() implements the
    same ISO 8601 week-numbering rule directly, so this just formats it to
    match the Worker's "<year>-W<week>" string. `date` must be UTC-aware,
    matching the Worker's use of Date.UTC."""
    year, week, _ = date.isocalendar()
    return f"{year}-W{week:02d}"


def watch_count_key(channel_id, week):
    """Matches worker/watch-counter.js's watchCountKey() — the Worker and
    this export must agree on the KV key shape or the export reads the
    wrong (or no) key."""
    return f"{channel_id}:{week}"


def build_snapshot(raw_counts, known_channels, week, generated_at):
    """Pure — no API calls, no I/O. Given raw per-channel counts (as read
    from KV; a channel with zero watches this week never got a KV key
    written at all, so it's simply absent from raw_counts — see
    watch-counter.js's recordWatch) and the full known-channel list (from
    channels.yaml), produces the snapshot JSON content: every known
    channel present, defaulting an absent one to 0, sorted for a stable
    diff."""
    channels = {channel_id: raw_counts.get(channel_id, 0) for channel_id in sorted(known_channels)}
    return {"week": week, "generated_at": generated_at, "channels": channels}


def fetch_all_counts(known_channels, week, *, account_id, namespace_id, api_token, fetch_fn):
    """Read this week's count for every known channel via fetch_fn (the
    real, untested fetch_channel_count in production; injectable for
    testing). Omits a channel entirely from the result if fetch_fn
    returns None for it (no KV key yet) — build_snapshot is what fills
    that in as 0."""
    counts = {}
    for channel_id in known_channels:
        count = fetch_fn(channel_id, week, account_id=account_id, namespace_id=namespace_id, api_token=api_token)
        if count is not None:
            counts[channel_id] = count
    return counts


def fetch_channel_count(channel_id, week, *, account_id, namespace_id, api_token):
    """Thin IO glue, deliberately untested — the real Cloudflare API call
    itself (same philosophy as pipeline.fetch_video_metadata and
    discover.py's search_videos). Returns None if the key has no value yet
    (a channel with zero watches this week never got a KV key written at
    all — see watch-counter.js's recordWatch), the count otherwise."""
    key = watch_count_key(channel_id, week)
    url = KV_READ_URL.format(
        account_id=account_id,
        namespace_id=namespace_id,
        key=urllib.parse.quote(key, safe=""),
    )
    request = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_token}"})
    try:
        with urllib.request.urlopen(request) as response:
            return int(response.read().decode().strip())
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise


def write_snapshot(snapshot, out_dir=OUTPUT_DIR):
    """Writes {out_dir}/{week}.json — never under docs/, so it's never
    served as part of the live GitHub Pages site."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{snapshot['week']}.json"
    with path.open("w") as f:
        json.dump(snapshot, f, indent=2)
        f.write("\n")
    return path


def main():
    account_id = os.environ.get("CF_ACCOUNT_ID")
    namespace_id = os.environ.get("CF_KV_NAMESPACE_ID")
    api_token = os.environ.get("CF_API_TOKEN")
    if not (account_id and namespace_id and api_token):
        sys.exit("Set CF_ACCOUNT_ID, CF_KV_NAMESPACE_ID, and CF_API_TOKEN before running this script.")

    # Group by Channel (display_name), matching what the Worker validates
    # and keys by — not by curation source key, which would fragment a
    # single Channel's watches across every source that feeds its lineup
    # (e.g. fenkil/fenkil_diaspora both display as "Fenkil").
    known_channels = pipeline.load_channel_display_names()
    now = datetime.datetime.now(datetime.timezone.utc)
    week = iso_week_key(now)

    raw_counts = fetch_all_counts(
        known_channels,
        week,
        account_id=account_id,
        namespace_id=namespace_id,
        api_token=api_token,
        fetch_fn=fetch_channel_count,
    )
    snapshot = build_snapshot(raw_counts, known_channels, week, now.isoformat())
    path = write_snapshot(snapshot)
    total = sum(snapshot["channels"].values())
    print(f"Wrote {path} ({total} total watch(es) across {len(known_channels)} channel(s))")


if __name__ == "__main__":
    main()
