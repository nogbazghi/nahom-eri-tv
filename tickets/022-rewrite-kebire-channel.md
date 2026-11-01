# 022: Rewrite kebire_channel.py on top of pipeline.py + channels.yaml

**Depends on:** 019, 020

## Context

Read the current `curation/kebire_channel.py` first, then `curation/pipeline.py` (ticket 020) and `curation/channels.yaml` (ticket 019).

## Required behavior

1. Loop over every entry in `channels.yaml` where `type == "channel"` (today that's just `kebire`) — don't hardcode the key, same generalization reasoning as ticket 021.
2. For each such channel:
   - Resolve its uploads playlist from `channel_id` (existing logic: `channels.list` → `contentDetails.relatedPlaylists.uploads`), paginate `playlistItems.list` to get every uploaded video ID (existing logic, keep it).
   - Filter to IDs not already in that channel's current `videos.json` entries and not in `blocklist.yaml` — these are the fresh candidates.
   - For candidates, apply the `text_filter` check (substring match, case-insensitive, against title OR description) — this is channel-specific matching logic that happens BEFORE validation, since it's about relevance, not quality; `pipeline.validate_record` doesn't know about `text_filter`.
   - Load current stored videos for this channel from `docs/data/videos.json`.
   - Call `pipeline.compute_run(...)` same as ticket 021, with the text-filter-passing candidate IDs.
   - Call `pipeline.write_channel_result(...)` and `pipeline.write_run_summary(...)`.
3. No more `import fetch_metadata as fm` — import from `curation/pipeline.py`.

## Verification

Run it for real against the live API. Confirm `docs/data/videos.json`'s Kebire entry gets a `lastValidated` stamp, `curation/.pending/kebire.json` is written correctly, and re-running immediately doesn't spuriously remove the existing video (same false-removal check as ticket 021).

## Acceptance

- Script runs end-to-end against the real API, produces correct output, doesn't regress Weddings' data.
