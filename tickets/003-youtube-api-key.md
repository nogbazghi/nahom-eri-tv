# 003: Get a YouTube Data API key

**Depends on:** none

## Steps

1. Go to the Google Cloud Console (console.cloud.google.com), create a project (or reuse one).
2. Enable the "YouTube Data API v3" for that project.
3. Create credentials → API key. Optionally restrict it to the YouTube Data API v3 for safety.
4. Export it locally (do not commit it):
   ```
   export YOUTUBE_API_KEY=your-key-here
   ```
   Consider adding that line to your shell profile (`~/.zshrc`) so it persists across sessions, or to a local `.env` file that's git-ignored.

## Acceptance

- `echo $YOUTUBE_API_KEY` prints a key in the shell you'll run the curation scripts from.
- The key is NOT committed anywhere in the repo (check `git status` / `git diff` before committing after this ticket).
