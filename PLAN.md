# Nahom Eri TV — Plan

Roadmap from current state to soft launch (M3), plus a verification pass on the M4 discovery script and a placeholder for M5. See `Nahom Eri TV — Design Document v1.md` for the full design; this file tracks execution.

This is a lightweight plan, not a `write-plan`-style TDD implementation plan — most of what's left is scripting, content, and launch logistics, not a codebase with a test suite to drive red/green against. Tickets live in `/tickets/`, one file per ticket, written to be actionable by either Nahom or a future Claude session (exact file paths and commands, not just descriptions).

## Current state

- Design doc (v1) complete; 4 open questions have proposed answers awaiting confirmation (ticket 009).
- `curation/seed_videos.yaml`: 8 hand-picked candidates added via web search, none API-verified yet; 4 are guayla music/dance clips worth a second look before publishing (ticket 002).
- `curation/fetch_metadata.py`: built, not yet run against a real API key.
- `curation/discover.py` (M4 script): built, not yet run against the real API (ticket 011).
- `docs/`: static page, player, and shared-broadcast logic built; not yet tested in a browser (ticket 005).
- Git repo initialized locally (`main`, one commit); no GitHub remote yet (ticket 001).

## Tickets, in order

| # | Ticket | Milestone | Depends on |
|---|--------|-----------|------------|
| 001 | Set up GitHub remote and push | — | — |
| 002 | Review and trim the hand-picked seed list | M1 | — |
| 003 | Get a YouTube Data API key | M1 | — |
| 004 | Run `fetch_metadata.py` and verify the lineup | M1 | 002, 003 |
| 005 | Test the pilot page locally | M2 | 004 |
| 006 | Fix player bugs found in 005 | M2 | 005 |
| 007 | Enable GitHub Pages | M2 | 001, 004 |
| 008 | Fill in page content placeholders | M2 | 009 |
| 009 | Confirm design-doc open questions | — | — |
| 010 | Soft launch | M3 | 005, 007, 008 |
| 011 | Validate `discover.py` end-to-end | M4 | 003 |
| 012 | Pick and scope a second channel (placeholder) | M5 | 010 |

Tickets 001–010 are the path to soft launch. 011 can run any time after a key exists — it doesn't block launch since the pilot ships on the hand-picked list (per the earlier decision that M4 "replaces hand-picking" once it's trusted, not before). 012 is intentionally undetailed until pilot results exist.
