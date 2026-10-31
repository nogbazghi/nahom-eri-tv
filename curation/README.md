# Curation

`../docs/data/videos.json` holds a flat pool of videos (each tagged with a `channels` array) plus a `schedules` map with one entry per channel (`scheduleStart`, and `default: true` on exactly one channel). Each script below only ever replaces its own channel's videos and leaves every other channel's entries and schedule untouched — see `merge_channel` in `fetch_metadata.py`, which the other scripts reuse.

## Weddings channel

Hand-picked bootstrap:
1. Add hand-picked videos to `seed_videos.yaml` (one entry per video).
2. `export YOUTUBE_API_KEY=...`
3. `pip install -r requirements.txt`
4. `python fetch_metadata.py`

Automated discovery (M4, replaces hand-picking — see `discover.py`'s `RULES`):
- `python discover.py`

## Kebire channel

Every public, embeddable video from Kebire's YouTube channel containing `#eritrea` in its title or description (no view-count filter — this is one known creator's catalog, not an unvetted pool):
- `python kebire_channel.py`

## Excluding a video

Add it to `blocklist.yaml` (with a reason and date) and re-run whichever script generated it.
