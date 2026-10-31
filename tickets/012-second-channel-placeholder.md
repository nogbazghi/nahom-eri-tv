# 012: Pick and scope a second channel (M5, placeholder)

**Depends on:** 010 (soft launch + two weeks of metrics)

## Context

Deliberately undetailed — the design doc frames this as a decision to make "based on pilot results." Writing a detailed plan now would mean guessing at a channel rule and viewer promise nobody has validated yet.

## Steps (to flesh out after 010)

1. Review the two-week metrics from `LAUNCH_LOG.md` and informal viewer feedback.
2. Choose the next channel from the design doc's Channel lineup table — most likely Language or Places, per the design doc's M5 note.
3. Write its rule (tag/language/city/date filters) and add it to `RULES` in `curation/discover.py`.
4. Revisit the channel-switcher UI, which was deliberately skipped for the pilot (design doc's Architecture section) — this is the point where it becomes needed.

## Acceptance

- Not yet scoped. Break this ticket into real sub-tickets once step 1–2 above happen.
