# Nahom Eri TV — Plan

Roadmap from current state to soft launch (M3), plus a verification pass on the M4 discovery script and a placeholder for M5. See `Nahom Eri TV — Design Document v1.md` for the full design; this file tracks execution.

This is a lightweight plan, not a `write-plan`-style TDD implementation plan — most of what's left is scripting, content, and launch logistics, not a codebase with a test suite to drive red/green against. Tickets live in `/tickets/`, one file per ticket, written to be actionable by either Nahom or a future Claude session (exact file paths and commands, not just descriptions).

## Current state

- Design doc (v1) complete, all open questions resolved (ticket 009) — including the owner decision to launch with no contact address for now (a known, tracked gap, not an oversight).
- Pilot lineup is live: 7 verified Weddings videos (ticket 002/004), pushed to GitHub (ticket 001) and served via GitHub Pages at https://nogbazghi.github.io/nahom-eri-tv/ (ticket 007).
- Page tested end-to-end locally and against live data (ticket 005) — autoplay, credit block, auto-skip, and shared-broadcast resume all confirmed working. No bugs found (ticket 006 stayed empty).
- `discover.py` (M4) verified working for real (ticket 011), but the pilot still ships on the hand-picked list — the replace-vs-wait decision is still open.
- **New:** a second design doc, `TV Guide & Multi-Channel — Design Document.md`, added a channel switcher and a second channel (Kebire). Both are built, tested against real data, and live (tickets 013–015). Two follow-ups came out of that work: Kebire's content is thinner than expected (ticket 016) and the header tagline is now stale (ticket 017).
- Soft launch (ticket 010) has not happened yet — tabled by the owner to do this multi-channel work first.

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
| 015 | Build the channel-switcher UI | — | done | 013 |
| 016 | Decide what to do about Kebire's thin lineup (1 video) | — | open | 014 |
| 017 | Update the header tagline for multi-channel | — | open | 015 |
| 018 | Generalize `discover.py` for multiple search-based channels | — | not yet needed | 013 |

Soft launch (010) is tabled, not blocked — 005/007/008 are all done, so it can resume whenever the owner wants, independent of 016–018.
