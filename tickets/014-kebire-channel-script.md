# 014: Build the Kebire channel curation script

**Status: done, but see ticket 016 — the result is thin.**
**Depends on:** 013

## What was done

`curation/kebire_channel.py`: resolves Kebire's channel ID (`UCz9a7XA9oMmk3CpFnE456bQ`, looked up from the video that prompted this feature), walks the channel's full uploads playlist via `playlistItems.list` pagination (not `search.list` — this retrieves every upload, not a keyword-matched subset), filters to public + embeddable + `#eritrea` present in title or description (no view-count filter, per the design doc). Merges into `docs/data/videos.json` under the `Kebire` channel slot using the same `merge_channel` helper `fetch_metadata.py` and `discover.py` use.

## Verification result

Ran against the live API: **found 1 video** out of Kebire's full upload history matching `#eritrea`. See ticket 016 for what to do about that.

## Acceptance (met)

- Script runs end-to-end against the real API and correctly populates the `Kebire` slot in `docs/data/videos.json` without disturbing `Weddings`.
