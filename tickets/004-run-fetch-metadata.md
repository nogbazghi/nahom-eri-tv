# 004: Run fetch_metadata.py and verify the lineup

**Depends on:** 002 (trimmed seed list), 003 (API key)

## Steps

1. From the project root:
   ```
   cd curation
   pip install -r requirements.txt
   python fetch_metadata.py
   ```
2. Check the script's stderr output for any `Warning: ... skipping` lines (not found, not public, or not embeddable) — those videos silently dropped out of the lineup.
3. Inspect the result:
   ```
   cd ..
   python3 -c "import json; d = json.load(open('docs/data/videos.json')); print(len(d['videos']), 'videos'); print('scheduleStart:', d['scheduleStart']); [print(v['id'], v['duration'], v['title']) for v in d['videos']]"
   ```

## Acceptance

- `docs/data/videos.json` has a non-empty `videos` array (at least 1 entry survived from the trimmed seed list).
- `scheduleStart` is a real ISO-8601 timestamp (not `null`).
- Every video entry has a plausible nonzero `duration` in seconds, and a `title`/`channel` that make sense (not placeholder text).
