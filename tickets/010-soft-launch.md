# 010: Soft launch (M3)

**Depends on:** 005 (page tested), 007 (live on GitHub Pages), 008 (no placeholders left)

## Before launching: known gap

There is currently no contact method on the page (ticket 008/009 — owner decision to launch without one for now). That means nobody can actually request a takedown, which was this design's only safeguard against the "no pre-publish review" trade-off (see design doc, Takedowns section). Launching without fixing this is a real risk, not a formality — worth a deliberate go/no-go, not an assumption.

## Steps

1. Share the GitHub Pages URL with a small group of viewers and the creators whose videos are featured (per the design doc's non-blocking courtesy-outreach decision — no formal permission needed, just a heads-up).
2. Start tracking the success metrics from the design doc's Analytics section for two weeks:
   - Videos in the lineup
   - Share of videos playing without error (watch for `onError` skips during the window)
   - Average watch time per visit (if/when analytics are added — otherwise informal feedback)
   - Takedown requests answered within 48 hours
3. Keep a simple running log (a new `LAUNCH_LOG.md` is fine) of: launch date, who was notified, any takedown/correction requests and when they were resolved.

## Acceptance

- The link has been shared.
- `LAUNCH_LOG.md` exists and has at least the launch date and notified group recorded.
- Two weeks after launch, the metrics are reviewed against the design doc's targets to inform ticket 012.
