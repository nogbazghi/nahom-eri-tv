# Curation

1. Add hand-picked videos to `seed_videos.yaml` (one entry per video).
2. `export YOUTUBE_API_KEY=...`
3. `pip install -r requirements.txt`
4. `python fetch_metadata.py`

This writes `../docs/data/videos.json`. `scheduleStart` is set the first time the file is generated and is preserved on every later run, even as the lineup changes.

To exclude a video (a takedown or dispute), add it to `blocklist.yaml` and re-run the script.
