# Changelog

A narrative history of what's changed in Nahom Eri TV, grouped by major version. This is different from `PLAN.md` (which tracks in-progress execution and open tickets) — this file is the record of what actually shipped, for anyone catching up on the project's history.

Versions here mark real service-level milestones, not package releases.

## v5 — Favorites & Live Events (2026-11-11 – 2026-11-15)

- Added **Favorites**: a toggle on each channel row pins it into its own section in the guide (below Live event rows, above the full channel list), for quick return. Kept entirely in the viewer's own browser storage — nothing is synced or shared, and favoriting doesn't reorder the guide otherwise. Built as pure `favorites.js` (`toggleFavorite`/`isFavorite`/`visibleFavorites`) plus `favorites-ui.js` wiring it to `localStorage` and a per-row button, mirroring the existing `i18n.js`/`i18n-ui.js` split; fails safe if storage is unavailable. Favorites identify a channel by its existing `display_name` rather than a new stable id, following the precedent already set by the shareable channel URL — see `GLOSSARY.md`'s "Favorite"/"Favorites section" and [ADR-0010](docs/adr/0010-favorites-identify-channels-by-display-name.md) for the accepted consequence (a future channel rename would silently drop everyone's favorite for it).
- Added **Live events**: a temporary guide row for a one-off live stream (a wedding, a festival) an organizer is running on their own YouTube channel, visible some lead time before its scheduled start and removed automatically after a fixed window. Unlike a Channel row, it tunes directly to one real live video rather than computing a position in a cyclic lineup, and "Go to Live" does a genuine live-edge seek rather than a re-tune. A maintainer adds one via a PR to `curation/live_events.yaml` (video id, display name, scheduled start, optional lead-time/expiry overrides); `merge_live_events.py` fetches its metadata and merges it into `docs/data/videos.json`, rejecting malformed entries with a clear warning instead of writing them silently. Live events are deliberately left unwired from Cast for now.
- Added a **Comedy** channel (Eritrean/Tigrinya/Habesha comedy, including political satire) — config-only, no application code, mirroring Weddings' thresholds.
- Added a **History** channel — config-only, no application code, mirroring the other theme channels.
- Spec: GitHub issue #82; implemented as tickets #83–#86. [ADR-0015](docs/adr/0015-live-events-are-curated-manually-submitted-and-ephemeral.md) (#87) records the three Live events design decisions.

## v4 — Cast to Chromecast/Android TV (2026-11-10 – 2026-11-15)

- Added Cast support: the live broadcast can now be cast to a Chromecast or Android TV device, with the TV's own remote driving channel switching directly — no phone required once casting has started. Built as a sender (`docs/cast-sender.js`, launches the receiver and hands off the channel currently showing locally) and an independent receiver page (`docs/cast-receiver.html`/`cast-receiver.js`) that reuses the exact same `schedule.js` position math and `offline-message.js` messaging as the main site, so the two surfaces can never drift out of sync.
- The receiver has its own large, high-contrast, D-pad-navigable channel menu (`docs/cast-receiver-menu.js`), built on the same `createListNav` module the main site's guide already uses: Up/Down moves focus, select/Enter retunes, Back/Escape closes.
- The physical remote's play/pause/volume/mute are wired directly into the YouTube player via `PlayerManager` message interceptors, since this receiver's actual playback happens outside the Cast Framework's own default media element.
- Fixed a race condition only reproducible on real Chromecast hardware: the YouTube IFrame API's readiness callback could fire before the receiver's module script (always deferred until after the document parses) had registered it, silently dropping the callback forever and leaving the receiver stuck on a black screen. Fixed with an early, non-module shim that records readiness regardless of which finishes first.
- Fixed a matching race on the sender side: the Cast Sender SDK can report `isAvailable === true` as soon as `chrome.cast` is ready, which isn't always the same moment the separate `?loadCastFramework=1` fetch finishes attaching the `cast` (CAF) namespace `cast-sender.js` actually needs. Hitting that gap threw `ReferenceError: cast is not defined` out of the readiness callback and left `#cast-button` stuck hidden for the rest of that page load — the intermittent "Cast button doesn't show up" symptom. Fixed by polling briefly for `cast.framework` before initializing instead of assuming it's already there.
- Remote Left/Right is deliberately left unbound, matching the same decision already made for the main site's channel guide — the broadcast position is intentionally never a per-viewer offset to seek within (see `GLOSSARY.md`'s "Live broadcast position").
- Fixed the receiver auto-disconnecting after ~2 minutes (#96): it plays video via the YouTube IFrame API directly and never calls `playerManager.load()`, so CAF saw no active media session and tore the app down on its default idle timeout. Passes `disableIdleTimeout: true` to `CastReceiverContext.start()`, which the Cast SDK docs call out for exactly this non-media-managed-playback case.
- Fixed `#cast-button` staying visible (with no click handler) on iOS, where Chrome is WebKit under the hood and never implements the Presentation API the Cast SDK needs: the same `[hidden]`-vs-author-styles cascade conflict already fixed three times before (`.install-hint`, `#receiver-message`, `#channel-menu-overlay`) — `.touch-target`'s `display: inline-flex` outranked the UA stylesheet's `[hidden] { display: none }`. This fourth recurrence is why a Playwright guardrail now asserts every `.hidden`-toggled element in `docs/` actually hides, in both directions, rather than relying on catching the next one by hand — see [ADR-0011](docs/adr/0011-playwright-guardrail-for-hidden-attribute-css-conflicts.md).
- Known follow-ups, still open: the remote's select/Enter button doesn't yet reliably retune a focused channel on at least one real device (#81, under active investigation), and the Cast button should stay disabled until a channel is set (#73).
- Spec: GitHub issue #35; implemented as tickets #38–#42, #80.

## v3 — Automated Curation Pipeline (2026-11-01)

- Added a **Go to Live** control, always visible as an overlay bottom-left on the player: re-tunes the current channel to its live broadcast position and resumes playback in one tap (or the `l` key) — reusing the exact same re-tune path as reselecting a channel from the guide, rather than a second resync mechanism. Translated label, consistent with the rest of the app's chrome text.
- Channels with nothing scheduled are now visibly disabled everywhere they appear: their guide row is greyed out, unselectable, and skipped by keyboard navigation; the player screen itself greys out when tuned to one; and the Go to Live control shows disabled (not hidden) rather than inert. All three share one tested source of truth, `docs/channel-availability.js`, for what counts as "empty."
- Spec: GitHub issue #46; implemented as tickets #52–#55.

- Redesigned curation as three explicit pieces — Search, Validation, Storage — instead of one blended script.
- Per-channel rules (search queries, view-count/duration minimums) move out of hardcoded Python into `curation/channels.yaml`, so adding a channel or a query is a data edit, not a code change.
- New shared `curation/pipeline.py`: a pure validation function (no API calls) checks both freshly-discovered candidates AND already-stored videos on every run — closing a real gap where a video could silently disappear from the lineup just because a search re-ranked it out of the results, not because it actually became invalid.
- New `curation/jobs.yaml` manifest + a scheduled GitHub Actions workflow (weekly, Mondays 13:00 UTC, plus a manual `workflow_dispatch` trigger): removals apply directly to `main` immediately (preserving the same-day takedown commitment), while new additions go through a Pull Request with a human-readable summary — keeping review lightweight without losing the safety net.
- Running for real since launch: PR #13 and its follow-up fix (`cb8cae2`, 2026-11-15) were the pipeline's first live incident — a search-based channel's validation checked only view count/duration/public/embeddable with no topic check at all, so YouTube's search fell back to generic trending results once a thin query's on-topic supply ran out. The fix shares the topic-filter guardrail `type: channel` rules already had, rather than patching each affected channel one-off.
- See `PLAN.md` tickets 019–024 and `curation/ARCHITECTURE.md`. Its own follow-on work — a per-candidate review dashboard (issue #105) and a viewership signal to prioritize curation effort (issue #113) — is tracked in `PLAN.md`, not here, until it ships.

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
