# 019: Define channels.yaml and jobs.yaml

**Status: done.**
**Depends on:** none

## What was done

Created `curation/channels.yaml` — one entry per channel, replacing the idea of a hardcoded `RULES` list in Python. Two entry types:
- `type: search` (Weddings): a `queries` list (generalizes beyond a fixed count — add a third query by adding a line), plus `view_count_min`/`duration_min_sec` thresholds.
- `type: channel` (Kebire): `channel_id` + `text_filter`, plus the same threshold fields (Kebire's `view_count_min: 0` means no floor).

Created `curation/jobs.yaml` — the list of scripts the scheduled automation runs (`discover.py`, `kebire_channel.py`). `fetch_metadata.py` is deliberately excluded — it stays a manual-only helper.

These two files are the fixed contract every other ticket in this batch (020–023) builds against. Read them before starting any of those.

## Acceptance (met)

- Both files exist with the schema above, committed.
