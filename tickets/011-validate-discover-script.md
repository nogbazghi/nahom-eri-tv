# 011: Validate discover.py end-to-end

**Status: verified (as a side effect of ticket 013's testing).**
**Depends on:** 003 (API key)

## Context

`curation/discover.py` (the M4 automated-discovery script) was written but never run against the real YouTube API.

## Verification result (2026-10-31, run during ticket 013's work)

Ran for real against the live API: it found 47 videos (vs. the 7 hand-picked ones), correctly replaced just the `Weddings` slot in `docs/data/videos.json`, left `Kebire` and the `schedules` map untouched, and preserved `Weddings`' own `scheduleStart`. The merge logic (ticket 013) is confirmed correct.

The **replace-vs-wait decision (step 5 below) was NOT made** — after verifying the merge worked, `fetch_metadata.py` was re-run afterward to restore the hand-picked 7 as the live lineup, since replacing it wasn't this ticket's call to make. That decision is still open.

## Steps

1. From `curation/`:
   ```
   cd curation
   python discover.py
   ```
2. Inspect `docs/data/videos.json` afterward — same inspection command as ticket 004.
3. Check specifically:
   - No video with fewer than 1,000 views got through.
   - No video ID from `curation/blocklist.yaml` is present.
   - `language`/`city` values look right for the query that should have found each video.
   - `channels` lists every channel whose rule matched (check `RULES` in `discover.py`).
4. ~~Fix the import-path quirk~~ — already fixed: `discover.py` now adjusts `sys.path` to its own directory, so it runs from either the repo root (`python curation/discover.py`) or from inside `curation/` (`cd curation && python discover.py`).
5. Decide (don't implement yet — just decide, and note it in `PLAN.md`): does this script's output replace the hand-picked `seed_videos.yaml`-derived lineup now, or only after soft launch (ticket 010) validates the approach? The design doc frames M4 as coming after the pilot's hand-picked bootstrap.

## Acceptance

- A real run completes and produces a sane `videos.json` per the checks above.
- The import-path issue is either fixed or documented, not left as a silent trap.
- The replace-vs-wait decision is written down in `PLAN.md`.
