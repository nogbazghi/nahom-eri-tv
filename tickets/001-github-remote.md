# 001: Set up GitHub remote and push

**Depends on:** none

## Context

The repo exists locally (`git log --oneline` shows one commit on `main`) but has no GitHub remote. GitHub Pages hosting (ticket 007) needs the repo to actually live on GitHub. `gh` CLI isn't installed in this environment, but Homebrew is (`brew` found at `/opt/homebrew/bin/brew`), so installing it is one command — see Option A. This needs your GitHub account/browser either way, so it's not something that can be done for you.

## Steps

1. Decide: public or private repo. (Private means GitHub Pages requires a paid plan for private-repo Pages on personal accounts — if cost matters, use public.)
2. Create and push the repo, either way:

   **Option A — `gh` CLI (faster, recommended):**
   ```
   brew install gh
   gh auth login          # opens a browser to authorize
   gh repo create nahom-eri-tv --public --source=. --push
   ```
   (Swap `--public` for `--private` per your step-1 decision. `--source=.` and `--push` create the GitHub repo from the existing local repo and push it in one step — no manual remote setup needed.)

   **Option B — manual web UI:**
   - Go to github.com/new, name it (e.g. `nahom-eri-tv`), do NOT initialize with a README/.gitignore/license (would conflict with the existing local commit).
   - From the project root:
     ```
     git remote add origin git@github.com:<your-username>/<repo-name>.git
     git push -u origin main
     ```
     (Use the HTTPS URL instead of SSH if you haven't set up an SSH key with GitHub.)

## Acceptance

- `git remote -v` shows an `origin` pointing at the new GitHub repo.
- `git push -u origin main` succeeds; the commit is visible on github.com.
