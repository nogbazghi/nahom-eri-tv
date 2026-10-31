# 007: Enable GitHub Pages

**Depends on:** 001 (remote exists), 004 (real `videos.json` committed and pushed)

## Steps

1. Make sure the latest `docs/` (including the real `docs/data/videos.json` from ticket 004) is committed and pushed to `main`:
   ```
   git add docs curation
   git commit -m "Populate pilot lineup with verified videos"
   git push
   ```
2. On github.com, open the repo → Settings → Pages.
3. Under "Build and deployment", set Source to "Deploy from a branch", branch `main`, folder `/docs`.
4. Save, wait for the Pages build to finish (a few minutes), and open the URL GitHub shows you.

## Acceptance

- The GitHub Pages URL loads the page and plays a video (same checks as ticket 005, now on the live hosted version).
