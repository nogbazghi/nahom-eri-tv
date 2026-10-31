# 018: Generalize discover.py for multiple search-based channels

**Depends on:** 013

## Context

`discover.py`'s merge logic currently assumes every rule in its `RULES` list targets the same single channel (true today — only "Weddings"). If a second search-based channel (e.g. a future Language or Places channel, per v1's M5) is ever added to `discover.py`, its merge step would need to replace entries per-channel-per-run, not assume one global channel name. Flagged by the implementing agent as an assumption, not fixed since it's out of current scope (no second search-based channel exists yet).

## Steps

1. When a second search-based channel is actually being added (not before — don't build this speculatively), generalize `discover.py`'s merge call to iterate per distinct channel name present in `RULES`, calling `merge_channel` once per channel with only that channel's matched videos.

## Acceptance

- Not yet needed. Revisit when M5 (second channel) actually happens, per `tickets/012-second-channel-placeholder.md`.
