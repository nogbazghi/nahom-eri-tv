# Git hooks

Tracked hooks live here instead of the untracked `.git/hooks`, so they're
version-controlled and shared by everyone who clones the repo.

## One-time setup

```sh
git config core.hooksPath .githooks
```

This setting lives in the shared `.git/config`, so it applies across every
worktree of this repo once set from any one of them — not just the one you
ran it from.

## What's here

- **`pre-push`** — runs the same checks CI runs (`node --test`, `pytest`)
  before a push is allowed to proceed. Skip it for one push with
  `git push --no-verify`.
