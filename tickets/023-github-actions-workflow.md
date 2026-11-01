# 023: Build the scheduled curation GitHub Actions workflow

**Depends on:** 021, 022 (needs their actual `curation/.pending/*.json` output to exist and match ticket 020's contract)

## One-time manual setup (you, not this ticket's agent)

Before this workflow can open PRs, enable it in repo settings: **Settings → Actions → General → Workflow permissions → "Allow GitHub Actions to create and approve pull requests."** This can't be set from the workflow YAML itself — flag it in your report if it looks unset, but don't try to work around it.

## Build `.github/workflows/curate.yml`

**Triggers:** `schedule` (weekly — pick a specific day/time, e.g. Monday 13:00 UTC) and `workflow_dispatch` (manual, for forcing a run — e.g. right after a `blocklist.yaml` edit).

**Permissions:** `contents: write`, `pull-requests: write`.

**Secrets:** `YOUTUBE_API_KEY` (you'll need to add this as a repo secret yourself — Settings → Secrets and variables → Actions — the workflow just references `${{ secrets.YOUTUBE_API_KEY }}`).

**Steps, in order:**

1. Checkout `main`, set up Python, `pip install -r curation/requirements.txt`.
2. Snapshot the current `docs/data/videos.json` content (before any script runs) — you'll need this as the "original" to apply removals against. (`cp docs/data/videos.json /tmp/original-videos.json` is enough.)
3. Read `curation/jobs.yaml` and run each listed script (`cd curation && python <script>` for each), with `YOUTUBE_API_KEY` exported from the secret. Don't hardcode the two script names in this step — read the list from the file (a one-line `python -c "import yaml; [print(s) for s in yaml.safe_load(open('curation/jobs.yaml'))]"` piped into a bash loop is enough).
4. After all scripts run, `docs/data/videos.json` on disk reflects the full target state (every channel's removals applied AND additions included — call this the "final" file). Collect all `curation/.pending/*.json` summary files written by the scripts.
5. **Removals-only commit to `main`:** build a version of `/tmp/original-videos.json` with every ID listed in any summary's `removals` deleted from its `videos` array (leave `schedules` untouched). If that result differs from `/tmp/original-videos.json` (i.e., there was at least one real removal), write it to `docs/data/videos.json`, commit, and push directly to `main` with a message like `"Remove N video(s) that failed revalidation [automated]"`. If there were zero removals across all summaries, skip this commit entirely.
6. **Additions via PR:** if every summary's `additions` list is empty, stop here — no PR step at all. Otherwise: checkout/create a branch named `curation/weekly-update` (reset it from the now-updated `main` if it already exists, rather than letting it diverge), write the "final" `docs/data/videos.json` (from step 4 — the complete post-removals-and-additions state) onto that branch, commit, push (force-push is fine since this branch is always meant to reflect the latest run, not accumulate history).
7. Build a PR body from the summaries, grouped by channel, e.g.:
   ```
   ## Weddings
   +2 videos
   - "Some New Wedding Title" (channel: SomeChannel)
   - "Another One" (channel: OtherChannel)

   ## Kebire
   No new videos this run.
   ```
   (Skip a channel's "no new videos" line if you prefer brevity — your call, just keep it scannable, not a raw JSON dump.)
8. Open a new PR if none exists for this branch against `main` (`gh pr create --head curation/weekly-update --base main --title "Weekly curation update" --body "$BODY" --reviewer nogbazghi`), or update the existing one's body if it does (`gh pr edit <number> --body "$BODY"`).

## Verification

You can't fully dry-run a scheduled trigger, but you can validate the YAML is well-formed (`gh workflow view` or a YAML lint), and you can trigger it for real via `gh workflow run curate.yml` once it's pushed (requires the API key secret and the repo permission from the one-time setup above to actually be in place — if either is missing, report that clearly rather than guessing at a workaround). Walk through the step logic by hand against a small constructed example (fake summary JSON files) to confirm the removals-vs-PR branching is correct before relying on a live run.

## Acceptance

- `.github/workflows/curate.yml` exists, is syntactically valid, and implements the removals-direct / additions-via-PR split exactly as described.
- A real triggered run (once secrets/permissions are in place) produces the expected result: a direct commit for any removals, and/or a PR with a readable summary for any additions, or neither if nothing changed.
