# 024: Document the curation pipeline architecture

**Depends on:** none (pure documentation — can run in parallel with 020–023, doesn't need the code to exist first)

## Context

This whole redesign (channels.yaml-driven config, the shared pipeline.py helpers, the removals-direct/additions-via-PR split, the weekly GitHub Actions job) came out of an architecture discussion that isn't written down anywhere yet except chat history. Future tickets, future agents, and future-you need a reference that doesn't require re-deriving the reasoning.

## Steps

Write `curation/ARCHITECTURE.md` covering:

1. **The three pillars** — Search (per-channel query lists or channel enumeration, defined in `channels.yaml`, restricted to recently-published candidates, returns enriched records not bare IDs), Validation (a pure function, no API calls, shared by every channel script, applied to both fresh candidates AND already-stored videos every run), Storage (`videos.json`'s flat pool + `schedules` map, plus the new `lastValidated` field).
2. **Why removals bypass PR review but additions don't** — removal only reduces risk (no judgment call needed), and gating it behind a PR merge would violate the design doc's same-day-takedown commitment; additions carry real judgment-call risk (copyright, relevance — see tickets 002/016's precedent) so they get a human glance first.
3. **Why `channels.yaml` exists instead of hardcoded Python rules** — generalizes beyond Weddings/Kebire to any future search-based or channel-based source without code changes, consistent with the project's existing "non-developers edit data, not code" principle (same reasoning as `blocklist.yaml`).
4. **Why this isn't a database** — summarize briefly: git-diffability for PR review, GitHub-web-UI editability, and the dataset's scale all favor plain files; link back to this reasoning if the question comes up again later.
5. **The actual data flow**, end to end: trigger → per-channel script (search/enumerate → validate fresh candidates + re-validate stored ones → compute additions/removals) → removals committed directly to `main` → additions committed to a standing branch + PR opened/updated with a readable summary → merge publishes via GitHub Pages.

Update `curation/README.md` to point at this doc and give the one-line "how to trigger a run manually" instruction (`gh workflow run curate.yml`, once ticket 023 lands). Update `PLAN.md`'s ticket table to include 019–024.

## Acceptance

- `curation/ARCHITECTURE.md` exists and is accurate against whatever 020–023 actually ship (if something diverged from this ticket's description during implementation, document what was actually built, not this plan).
