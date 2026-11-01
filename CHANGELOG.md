# Changelog

A narrative history of what's changed in Nahom Eri TV, grouped by major version. This is different from `PLAN.md` (which tracks in-progress execution and open tickets) — this file is the record of what actually shipped, for anyone catching up on the project's history.

Versions here mark real service-level milestones, not package releases.

## v3 — Automated Curation Pipeline (in progress, started 2026-11-01)

- Redesigned curation as three explicit pieces — Search, Validation, Storage — instead of one blended script.
- Per-channel rules (search queries, view-count/duration minimums) move out of hardcoded Python into `curation/channels.yaml`, so adding a channel or a query is a data edit, not a code change.
- New shared `curation/pipeline.py`: a pure validation function (no API calls) checks both freshly-discovered candidates AND already-stored videos on every run — closing a real gap where a video could silently disappear from the lineup just because a search re-ranked it out of the results, not because it actually became invalid.
- New `curation/jobs.yaml` manifest + a scheduled GitHub Actions workflow (weekly, plus a manual trigger): removals apply directly to `main` immediately (preserving the same-day takedown commitment), while new additions go through a Pull Request with a human-readable summary — keeping review lightweight without losing the safety net.
- Status: design complete, implementation in progress — see `PLAN.md` tickets 019–024 and `curation/ARCHITECTURE.md`.

## v2 — Multi-Channel & TV Guide Redesign (2026-10-31 – 2026-11-01)

- Added a second channel, **Kebire** — one creator's travel/landscape content about Eritrea, filtered to videos tagged `#eritrea` rather than his whole catalog.
- `docs/data/videos.json` restructured to support an independent broadcast schedule per channel (a `schedules` map), replacing the single global schedule — switching channels no longer resets or affects another channel's position.
- Rebuilt the UI as a **Classic Guide Grid** (DirecTV-style), prototyped first as a disposable mockup before being ported into the real site: full-bleed player with a channel-number corner badge, a toggleable EPG grid showing "now" and the next 2 programs per channel computed live from real schedule data, collapsing to a simple now-only list on mobile.
- Adopted a distinct type pairing (Big Shoulders Display, IBM Plex Sans, IBM Plex Mono) and a refined warm-neutral dark palette — fonts self-hosted, zero external network dependencies.
- Moved the repo to GitHub (`nogbazghi/nahom-eri-tv`) and went live on GitHub Pages.
- Design doc: `TV Guide & Multi-Channel — Design Document.md`.

## v1 — Pilot (2026-10-31)

- Initial design: one Weddings channel, shared-broadcast playback (every viewer sees the same video at the same point in time, like a real channel), no per-video approval gate — a saved search rule plus a reactive block list instead of manual review.
- Hand-picked, API-verified seed list of 7 wedding videos.
- Static site (`docs/`): vanilla HTML/CSS/JS, no framework, no backend. Muted autoplay with tap-to-unmute, silent auto-skip on playback error.
- Launched with no public contact address (a deliberate owner decision, tracked as a known gap rather than an oversight).
- Design doc: `Nahom Eri TV — Design Document v1.md`.
