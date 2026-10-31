# 013: Migrate data model to multi-channel schedules

**Status: done.**
**Depends on:** none

## Context

See `TV Guide & Multi-Channel — Design Document.md`. `docs/data/videos.json` needed a per-channel broadcast schedule instead of one global one, without splitting into per-channel files.

## What was done

- `docs/data/videos.json` now has a top-level `schedules` map (one entry per channel: `scheduleStart`, and `default: true` on exactly one channel), alongside the existing flat `videos` pool.
- `curation/fetch_metadata.py` gained `load_existing`/`merge_channel`/`write_output` helpers: a script now only replaces its own channel's entries in the pool and only touches its own `schedules` entry, leaving every other channel untouched.
- `curation/discover.py` reuses those same helpers for its own channel.
- Verified live: ran `fetch_metadata.py`, then `discover.py` (which correctly swapped Weddings' 7 hand-picked videos for 47 auto-discovered ones in the same slot), then re-ran `fetch_metadata.py` again to confirm the merge logic — Weddings went back to 7, Kebire's entry and `scheduleStart` were untouched, Weddings' own `scheduleStart` was preserved byte-for-byte across all three runs.

## Acceptance (met)

- `docs/data/videos.json` has both a `videos` pool and a `schedules` map, confirmed correct via a real multi-run test.
