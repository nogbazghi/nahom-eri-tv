# 011: Validate discover.py end-to-end

**Depends on:** 003 (API key)

## Context

`curation/discover.py` (the M4 automated-discovery script) was written but never run against the real YouTube API. It also has a known quirk: it does `import fetch_metadata`, so it only works when run from inside `curation/` — `python curation/discover.py` from the repo root will fail with an import error.

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
4. Fix the import-path quirk: either make `discover.py` runnable from the repo root too (e.g. adjust `sys.path` before `import fetch_metadata`, or switch to an explicit relative import), or clearly document in `curation/README.md` that it must be run from inside `curation/`.
5. Decide (don't implement yet — just decide, and note it in `PLAN.md`): does this script's output replace the hand-picked `seed_videos.yaml`-derived lineup now, or only after soft launch (ticket 010) validates the approach? The design doc frames M4 as coming after the pilot's hand-picked bootstrap.

## Acceptance

- A real run completes and produces a sane `videos.json` per the checks above.
- The import-path issue is either fixed or documented, not left as a silent trap.
- The replace-vs-wait decision is written down in `PLAN.md`.
