# Nahom Eri TV — Plan

Roadmap from current state to soft launch (M3), plus a verification pass on the M4 discovery script and a placeholder for M5. See `Nahom Eri TV — Design Document v1.md` for the full design; this file tracks execution.

This is a lightweight plan, not a `write-plan`-style TDD implementation plan — most of what's left is scripting, content, and launch logistics, not a codebase with a test suite to drive red/green against. Tickets live in `/tickets/`, one file per ticket, written to be actionable by either Nahom or a future Claude session (exact file paths and commands, not just descriptions).

## Current state

- Design doc (v1) complete, all open questions resolved (ticket 009) — including the owner decision to launch with no contact address for now (a known, tracked gap, not an oversight).
- Pilot lineup is live: 7 verified Weddings videos (ticket 002/004), pushed to GitHub (ticket 001) and served via GitHub Pages at https://nogbazghi.github.io/nahom-eri-tv/ (ticket 007).
- Page tested end-to-end locally and against live data (ticket 005) — autoplay, credit block, auto-skip, and shared-broadcast resume all confirmed working. No bugs found (ticket 006 stayed empty).
- `discover.py` (M4) verified working for real (ticket 011), but the pilot still ships on the hand-picked list — the replace-vs-wait decision is still open.
- A second design doc, `TV Guide & Multi-Channel — Design Document.md`, added a channel switcher and a second channel (Kebire). Both built, tested, and live (tickets 013–015). One follow-up remains open: Kebire's content is thinner than expected (ticket 016). Ticket 017 (stale tagline) resolved itself as a side effect of the redesign below.
- **New:** the UI was rebuilt as a Classic Guide Grid (DirecTV-style) — full-bleed player, corner badge, a toggleable EPG grid computed live from real schedule data, self-hosted fonts, mobile collapse. Prototyped first as an Artifact mockup, then ported into `docs/`. Live and verified.
- The automated curation pipeline (tickets 019–024) is designed **and built**, replacing manual script runs with a scheduled GitHub Actions job (`.github/workflows/curate.yml`, Mondays 13:00 UTC + manual `workflow_dispatch`). Key decisions: per-channel rules live in `curation/channels.yaml` (not hardcoded Python) for true generalization beyond Weddings/Kebire; a shared, pure `validate_record()` re-checks both freshly-discovered candidates AND already-stored videos every run (closing a real gap where a video could silently vanish just because a search re-ranked, not because it actually became invalid); removals apply directly to `main` (preserving the same-day-takedown commitment), while additions go through a Pull Request with a human-readable summary, so review stays lightweight without losing the safety net. See `curation/ARCHITECTURE.md` (ticket 024). It's running for real: PR #13 and the `cb8cae2` fix (off-topic content slipping into diaspora channels' search-based rules, because `type: search` channels had no topic/relevance check at all) are its first live incident and response — the missing guardrail (`text_filter`, borrowed from `type: channel`'s existing `candidate_matches()`) is now shared pipeline code, not a one-off patch.
- Cast support shipped (spec #35, tickets #38–#42, #80): the broadcast can be sent to a Chromecast or Android TV device, with the TV's own remote then driving channel switching directly. See `CHANGELOG.md` v4. Real-device verification (#91) found two bugs still open: #81 (remote select/Enter doesn't reliably retune a focused channel — under active investigation; see the temporary `[DEBUG-81kd]` instrumentation in `docs/cast-receiver.html`) and #73 (the Cast button should stay disabled until a channel is set). A third, the receiver auto-disconnecting after ~2 minutes because it never calls `playerManager.load()` and so has no CAF media session, is fixed (#96, `disableIdleTimeout: true`).
- **New:** issue #82 added two more channels and a Live events mechanism for one-off occasions (weddings, festivals) a live-streaming organizer wants featured temporarily. Comedy shipped as a config-only `channels.yaml` addition (#84); History (#83) is still open. Live events ship: `merge_live_events.py` merges manually-submitted events from `curation/live_events.yaml` into `videos.json` (#85), and the guide renders and tunes into their rows (#86) — a Live event row points at one real live stream rather than a computed cyclic position, and stays deliberately unwired from Cast for now. The design ADR is still open (#87).
- **New:** Favorites shipped (#89): a per-row toggle (#92) and a pinned Favorites section in the guide (#93), both kept in the viewer's own browser storage only, nothing synced. See [ADR-0010](docs/adr/0010-favorites-identify-channels-by-display-name.md) for why Favorites keys off `display_name` rather than a stable channel id, and the accepted consequence (a channel rename would silently drop everyone's favorite for it).
- **New:** issue #98 proposes dedicated TV-platform apps — packaging the existing web guide/player for a smart-TV platform's own web engine (Samsung Tizen, LG webOS, Fire TV), so a viewer installs and launches it directly on the TV instead of reaching it via Cast or AirPlay from a second device. [ADR-0012](docs/adr/0012-tv-platform-support-scoped-to-tizen-webos-firetv.md), backed by `docs/research/youtube-iframe-tv-platform-support.md`, scopes this to those three only: Apple TV and Roku have no web view to host the existing codebase on, and reaching them would take a business decision (rights to self-host video) before any engineering could help. Broken into tickets #99 (Tizen), #100 (webOS), and #101 (Fire TV, blocked on device/account access — `ready-for-human`).
- **New:** issue #105 proposes a Curation review dashboard to replace the all-or-nothing PR review above with per-candidate approve/reject (motivated directly by PR #13). Broken into tickets #106–#109 on the GitHub tracker. See [ADR-0013](docs/adr/0013-curation-review-dashboard-uses-client-side-pat.md) for why it authenticates with a client-side PAT rather than a backend/OAuth service, and `docs/prototype-curation-dashboard.html` for the UI prototype.
- **New:** issue #113 proposes a first-party, anonymous per-channel viewership count to prioritize curation effort, narrowing (not reversing) ADR-0008's no-client-side-observability stance. See [ADR-0014](docs/adr/0014-first-party-anonymous-viewership-counting-for-curation.md).
- Soft launch (ticket 010) has not happened yet — tabled by the owner to do UI and curation-pipeline work first.

## Tickets, in order

| # | Ticket | Milestone | Status | Depends on |
|---|--------|-----------|--------|------------|
| 001 | Set up GitHub remote and push | — | done | — |
| 002 | Review and trim the hand-picked seed list | M1 | done | — |
| 003 | Get a YouTube Data API key | M1 | done | — |
| 004 | Run `fetch_metadata.py` and verify the lineup | M1 | done | 002, 003 |
| 005 | Test the pilot page locally | M2 | done | 004 |
| 006 | Fix player bugs found in 005 | M2 | done (no bugs found) | 005 |
| 007 | Enable GitHub Pages | M2 | done | 001, 004 |
| 008 | Fill in page content placeholders | M2 | done (no contact address, by owner decision) | 009 |
| 009 | Confirm design-doc open questions | — | done | — |
| 010 | Soft launch | M3 | **tabled** | 005, 007, 008 |
| 011 | Validate `discover.py` end-to-end | M4 | verified; replace-vs-wait decision still open | 003 |
| 012 | Pick and scope a second channel (placeholder) | M5 | superseded by Kebire (013–016) | 010 |
| 013 | Migrate data model to multi-channel schedules | — | done | — |
| 014 | Build the Kebire channel curation script | — | done, thin result | 013 |
| 015 | Build the channel-switcher UI (superseded by the Classic Guide Grid redesign) | — | done | 013 |
| 016 | Decide what to do about Kebire's thin lineup (1 video) | — | open | 014 |
| 017 | Update the header tagline for multi-channel | — | resolved (tagline removed by redesign) | 015 |
| 018 | Generalize `discover.py` for multiple search-based channels | — | superseded by 019 (`channels.yaml`) | 013 |
| 019 | Define `channels.yaml` and `jobs.yaml` | — | done | — |
| 020 | Build shared `curation/pipeline.py` (search/validate/merge helpers) | — | done (2026-11-01) | 019 |
| 021 | Rewrite `discover.py` on the new pipeline | — | done (2026-11-01) | 019, 020 |
| 022 | Rewrite `kebire_channel.py` on the new pipeline | — | done (2026-11-01) | 019, 020 |
| 023 | Build the scheduled GitHub Actions curation workflow | — | done (2026-11-01), hardened 2026-11-05 and 2026-11-15 (`cb8cae2`) | 021, 022 |
| 024 | Document the curation pipeline architecture | — | done (2026-11-01) | — |

Soft launch (010) is tabled, not blocked — 005/007/008 are all done, so it can resume whenever the owner wants, independent of everything else here.

019–024 all landed 2026-11-01 and the pipeline has been running on its weekly schedule since. Issue #105 (Curation review dashboard, tickets #106–#109) and issue #113 (per-channel viewership counting) are the active curation follow-on work, both prompted directly by running the pipeline for real: #105 by the additions-review gap PR #13 exposed, #113 by wanting to prioritize curation effort by what's actually watched. Cast (#35), Live events/new channels (#82), Favorites (#89), and TV Platform Apps (#98) are the other active fronts — see the bullets above for each one's open sub-issues.
