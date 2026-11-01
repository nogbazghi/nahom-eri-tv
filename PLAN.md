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
- **New:** a proper automated curation pipeline is designed (not yet built) — replacing manual script runs with a scheduled GitHub Actions job. Key design decisions: per-channel rules live in `curation/channels.yaml` (not hardcoded Python) for true generalization beyond Weddings/Kebire; a shared, pure `validate()` function re-checks both freshly-discovered candidates AND already-stored videos every run (closing a real gap where a video could silently vanish just because a search re-ranked, not because it actually became invalid); removals apply directly to `main` (preserving the same-day-takedown commitment), while additions go through a Pull Request with a human-readable summary, so review stays lightweight without losing the safety net. See `curation/ARCHITECTURE.md` (ticket 024) once written, and tickets 019–024.
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
| 020 | Build shared `curation/pipeline.py` (search/validate/merge helpers) | — | open — **do first**, everything below depends on it | 019 |
| 021 | Rewrite `discover.py` on the new pipeline | — | open | 019, 020 |
| 022 | Rewrite `kebire_channel.py` on the new pipeline | — | open | 019, 020 |
| 023 | Build the scheduled GitHub Actions curation workflow | — | open | 021, 022 |
| 024 | Document the curation pipeline architecture | — | open — can run anytime, no code dependency | — |

Soft launch (010) is tabled, not blocked — 005/007/008 are all done, so it can resume whenever the owner wants, independent of everything else here.

**Parallelization note for 019–024:** 020 is the critical-path bottleneck — 021, 022, and 023 all import its exact function contracts, so it should land before those three start (or at minimum, its interface should be fixed before 021/022/023 begin, even if run in parallel on trust). 021 and 022 touch disjoint files and can run fully in parallel with each other once 020 exists. 023 needs 021 and 022's actual `.pending/*.json` output to build against. 024 has no code dependency and can run in parallel with all of the above.
