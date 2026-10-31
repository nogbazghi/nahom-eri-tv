# 002: Review and trim the hand-picked seed list

**Depends on:** none

## Context

`curation/seed_videos.yaml` has 8 candidates found via web search — none independently confirmed public/embeddable, and titles/channels are leads, not verified facts. Four of them are flagged as guayla (music/dance) performance clips rather than full wedding videography:

- `5zOUjoKkksc` — Robi & Meaza, guayla, Netherlands
- `5L-jjQ2KaaI` — DC guayla clip
- `kveqL6-bWAA` — guayla performance (Tedros Kahsay / Xaedu)
- `R5Et-odTT4g` — Wedi Gumsa guayla segment

The design doc's non-goals explicitly exclude playing copyrighted music without clearance, and these look like dance/music performances rather than a videographer's wedding film — they likely contain copyrighted music playing over the dancing.

## Steps

1. Open `curation/seed_videos.yaml`.
2. For each of the 4 flagged entries: watch enough of it to judge whether it's primarily a music/dance performance with copyrighted music playing, or legitimate wedding-day footage. Remove the entry if so, or note in its `notes` field why you're keeping it (e.g. "no audible copyrighted track" / "videographer's own content").
3. For the other 4 entries, do a quick sanity check on the title match (especially `YaQd8H6rdm4`, flagged as a generic/low-confidence title).
4. Delete any entries you're not comfortable publishing. It's fine to end up with fewer than 8 — ticket 004 just needs at least 1 to produce a working `videos.json`.

## Acceptance

- `curation/seed_videos.yaml` contains only entries you'd be comfortable seeing live on the page.
- No remaining entry's `notes` field still says only "needs verification via fetch_metadata.py" with no judgment recorded — every kept entry has either been watched or explicitly deferred to automated verification.
