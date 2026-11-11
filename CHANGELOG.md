# Changelog

A narrative history of what's changed in Nahom Eri TV, grouped by major version. This is different from `PLAN.md` (which tracks in-progress execution and open tickets) — this file is the record of what actually shipped, for anyone catching up on the project's history.

Versions here mark real service-level milestones, not package releases.

## v4 — Cast to Chromecast/Android TV (2026-11-10)

- Added Cast support: the live broadcast can now be cast to a Chromecast or Android TV device, with the TV's own remote driving channel switching directly — no phone required once casting has started. Built as a sender (`docs/cast-sender.js`, launches the receiver and hands off the channel currently showing locally) and an independent receiver page (`docs/cast-receiver.html`/`cast-receiver.js`) that reuses the exact same `schedule.js` position math and `offline-message.js` messaging as the main site, so the two surfaces can never drift out of sync.
- The receiver has its own large, high-contrast, D-pad-navigable channel menu (`docs/cast-receiver-menu.js`), built on the same `createListNav` module the main site's guide already uses: Up/Down moves focus, select/Enter retunes, Back/Escape closes.
- The physical remote's play/pause/volume/mute are wired directly into the YouTube player via `PlayerManager` message interceptors, since this receiver's actual playback happens outside the Cast Framework's own default media element.
- Fixed a race condition only reproducible on real Chromecast hardware: the YouTube IFrame API's readiness callback could fire before the receiver's module script (always deferred until after the document parses) had registered it, silently dropping the callback forever and leaving the receiver stuck on a black screen. Fixed with an early, non-module shim that records readiness regardless of which finishes first.
- Fixed a matching race on the sender side: the Cast Sender SDK can report `isAvailable === true` as soon as `chrome.cast` is ready, which isn't always the same moment the separate `?loadCastFramework=1` fetch finishes attaching the `cast` (CAF) namespace `cast-sender.js` actually needs. Hitting that gap threw `ReferenceError: cast is not defined` out of the readiness callback and left `#cast-button` stuck hidden for the rest of that page load — the intermittent "Cast button doesn't show up" symptom. Fixed by polling briefly for `cast.framework` before initializing instead of assuming it's already there.
- Remote Left/Right is deliberately left unbound, matching the same decision already made for the main site's channel guide — the broadcast position is intentionally never a per-viewer offset to seek within (see `GLOSSARY.md`'s "Live broadcast position").
- Known follow-up: the remote's select/Enter button doesn't yet reliably retune a focused channel on at least one real device — tracked as #81.
- Spec: GitHub issue #35; implemented as tickets #38–#42.

## v3 — Automated Curation Pipeline (in progress, started 2026-11-01)

- Added a **Go to Live** control, always visible as an overlay bottom-left on the player: re-tunes the current channel to its live broadcast position and resumes playback in one tap (or the `l` key) — reusing the exact same re-tune path as reselecting a channel from the guide, rather than a second resync mechanism. Translated label, consistent with the rest of the app's chrome text.
- Channels with nothing scheduled are now visibly disabled everywhere they appear: their guide row is greyed out, unselectable, and skipped by keyboard navigation; the player screen itself greys out when tuned to one; and the Go to Live control shows disabled (not hidden) rather than inert. All three share one tested source of truth, `docs/channel-availability.js`, for what counts as "empty."
- Spec: GitHub issue #46; implemented as tickets #52–#55.

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
