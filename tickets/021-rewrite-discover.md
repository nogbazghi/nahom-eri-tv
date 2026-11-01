# 021: Rewrite discover.py on top of pipeline.py + channels.yaml

**Depends on:** 019, 020

## Context

Read the current `curation/discover.py` first, then `curation/pipeline.py` (ticket 020) and `curation/channels.yaml` (ticket 019). This is a rewrite, not a patch — the merge logic, query handling, and channel-scoping all change.

## Required behavior

1. Loop over every entry in `channels.yaml` where `type == "search"` (today that's just `weddings`, but don't hardcode the key — a second search-based channel added later to `channels.yaml` should work without touching this file, per the generalization goal this whole redesign is for).
2. For each such channel:
   - For each query in its `queries` list, call `search.list` with `publishedAfter` set to roughly 10 days before now (a rolling window with buffer past the weekly cadence, so a missed run doesn't lose candidates) and `type=video`. Collect candidate video IDs across all its queries (dedup).
   - Drop any candidate ID already present in that channel's current `videos.json` entries (no point re-processing something `compute_run` will handle via the stored-videos path) and any ID in `curation/blocklist.yaml`.
   - Load that channel's current stored videos from `docs/data/videos.json` (entries whose `channels` is exactly `[display_name]`).
   - Call `pipeline.compute_run(channel_key, display_name, stored_videos, candidate_ids, rules, api_key, blocked_ids)`.
   - For newly-added records in the result, fill in `language`/`city`/`tags` the same way the current code infers them if you can determine a reasonable default (today's code doesn't really have a clean answer for this either — matching the design doc's "tag by the query that found it" decision from the TV Guide doc is fine: stamp the language/city implied by whichever query string found it, if parseable, else leave blank). Don't over-engineer this — it's a minor field, not the point of this ticket.
   - Call `pipeline.write_channel_result(...)` to merge into `docs/data/videos.json`, and `pipeline.write_run_summary(channel_key, additions, removals)`.
3. Keep requiring `YOUTUBE_API_KEY` from the environment, same as today.
4. No more `import fetch_metadata as fm` — import from `curation/pipeline.py` instead.

## Verification

Run it for real against the live API (`export $(cat ../.env | xargs)` then `python discover.py` from `curation/`, or `python curation/discover.py` from repo root — both must work). Confirm:
- `docs/data/videos.json`'s Weddings entries get `lastValidated` stamps.
- `curation/.pending/weddings.json` is written with a sane additions/removals breakdown.
- Re-running it immediately after produces few/no new additions (since nothing changed) and no false removals (nothing should drop out just because this run's search didn't re-surface it — that's the exact bug this whole redesign fixes; previously-stored videos are only removed if `validate_record` actually fails them, not based on search-result absence).

## Acceptance

- Script runs end-to-end against the real API, produces correct `videos.json` and `.pending/weddings.json` output, doesn't regress any other channel's data.
