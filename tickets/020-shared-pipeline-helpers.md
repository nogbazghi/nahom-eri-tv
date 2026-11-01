# 020: Build curation/pipeline.py — shared search/validation/merge helpers

**Depends on:** 019

## Context

Read `curation/channels.yaml` and `curation/jobs.yaml` first (ticket 019). Also read the existing `curation/fetch_metadata.py` in full — several of its pieces (`parse_duration`, the `videos.list` batching pattern, `load_yaml_list`, `load_existing`/`write_output`) should move into this new shared module rather than staying only in `fetch_metadata.py`, since `discover.py` and `kebire_channel.py` need them as peers, not as consumers of the hand-picked-bootstrap script.

This is the most important ticket in the batch to get exactly right — tickets 021, 022, and 023 all import from what you build here, likely built by different people/agents who won't see each other's code, only this ticket's contract.

## Build `curation/pipeline.py` with exactly these functions

```python
def load_channels_config(path=CHANNELS_FILE) -> dict:
    """Parse channels.yaml, return {channel_key: {type, display_name, ...}}."""

def load_jobs_list(path=JOBS_FILE) -> list[str]:
    """Parse jobs.yaml, return the list of script filenames."""

def fetch_video_metadata(video_ids: list[str], api_key: str) -> dict[str, dict]:
    """
    Batch-call videos.list (part=snippet,contentDetails,status,statistics)
    in groups of 50 (reuse the existing batching pattern). Returns a dict
    keyed by video ID, each value:
      {
        "title": str, "channel": str (channelTitle), "description": str,
        "published": str (YYYY-MM-DD), "duration": int (seconds, via
        parse_duration), "public": bool (status.privacyStatus == "public"),
        "embeddable": bool (status.embeddable), "view_count": int
        (statistics.viewCount, default 0 if missing/disabled),
      }
    An ID the API doesn't return (deleted/never existed) is simply absent
    from the result dict — callers must handle a missing key as "gone."
    """

def validate_record(record: dict, rules: dict) -> tuple[bool, str | None]:
    """
    PURE function — no API calls, no I/O. `record` is one value from
    fetch_video_metadata()'s return dict. `rules` is one channel's entry
    from channels.yaml (has view_count_min, duration_min_sec).
    Returns (True, None) if the record passes all checks, else
    (False, reason) where reason is one of:
      "private", "not embeddable", "too short", "too few views", "removed"
    (use "removed" if the ID was missing from fetch_video_metadata's result
    — caller passes a sentinel record like {"missing": True} for that case).
    Check order: missing -> private -> not embeddable -> too short -> too few views.
    """

def compute_run(
    channel_key: str,
    display_name: str,
    stored_videos: list[dict],      # this channel's current entries from videos.json
    fresh_candidate_ids: list[str],  # newly found by search/enumeration, not yet in the pool
    rules: dict,                     # this channel's channels.yaml entry
    api_key: str,
    blocked_ids: set[str],
) -> dict:
    """
    Orchestrates one full channel run:
      1. Re-fetch metadata for every ID in stored_videos (their own `id`
         field) via fetch_video_metadata. Run validate_record on each
         (treat a blocked ID as an automatic fail, reason "blocklisted",
         without needing an API call for it). Videos that still pass keep
         their existing record's language/city/tags/channels/notes fields,
         but refresh title/channel/duration from the new fetch, and stamp
         `lastValidated` = now (UTC ISO). Videos that fail go into removals.
      2. Fetch metadata for fresh_candidate_ids (skip any already in
         stored_videos — don't re-process). Run validate_record (+
         blocklist check) on each. Passing ones become new video records
         (same shape as existing videos.json entries: id, title, channel,
         language, city, tags, published, duration, channels, notes,
         lastValidated) — `channels` is `[display_name]`, `language`/`city`/
         `tags`/`notes` default to "" / [] / "" unless the caller knows
         better (discover.py/kebire_channel.py may fill these in after
         calling compute_run, see their own tickets). Failing ones are
         just dropped silently (never existed in the pool, not a "removal").
      3. Return:
         {
           "final_videos": [...],   # kept (post-revalidation) + newly added
           "additions": [...],       # just the newly added video records
           "removals": [             # videos that dropped out this run
             {"id": ..., "title": ..., "reason": ...}, ...
           ],
         }
    """

def write_channel_result(existing_data: dict, channel_key_display_name: str,
                          final_videos: list[dict], is_default: bool) -> dict:
    """
    Same contract as today's merge_channel() in fetch_metadata.py (replace
    only this channel's entries in the flat pool, leave every other
    channel's entries and schedules untouched, create schedules[name] with
    a fresh scheduleStart only if it doesn't already exist, never touch an
    existing scheduleStart or default value) — except it takes the FINAL
    already-computed video list directly instead of fetching anything
    itself. Move this logic here from fetch_metadata.py; have
    fetch_metadata.py import it from here afterward instead of the other
    way around (discover.py should no longer need `import fetch_metadata`).
    """

def write_run_summary(channel_key: str, additions: list[dict],
                       removals: list[dict], out_dir="curation/.pending") -> None:
    """
    Write {out_dir}/{channel_key}.json:
      {"channel": channel_key, "additions": [...], "removals": [...]}
    Create out_dir if missing. This directory should be .gitignore'd —
    it's a transient hand-off to the GitHub Actions workflow (ticket 023),
    not committed data.
    """
```

Also move `parse_duration` and the YAML-list loader here (or keep thin re-exports in `fetch_metadata.py` for backward compatibility — your call, but `discover.py`/`kebire_channel.py` must import these from `pipeline.py`, not `fetch_metadata.py`).

Add `curation/.pending/` to `.gitignore`.

## Verification

Write a few quick inline sanity checks (not a full test suite — this project has none) exercising `validate_record` against hand-constructed records for each failure reason, and `compute_run`/`write_channel_result` against a small fake `existing_data` + fake `fetch_video_metadata` (you can monkeypatch it or structure `compute_run` to accept an injectable fetch function for testability — your call on exact approach). Show the results in your report; don't leave this unverified just because there's no existing test harness to extend.

## Acceptance

- `curation/pipeline.py` exists with all functions above, correct per their docstrings.
- `curation/fetch_metadata.py` still works standalone (manual bootstrap flow unchanged from a user's perspective) but now imports shared logic from `pipeline.py` rather than being the thing other scripts import from.
- `.gitignore` covers `curation/.pending/`.
