---
status: accepted
---

# The CI required status check gates pull-request merges only, not direct pushes to main

Branch protection's required status check is configured to block merging a pull request with a failing CI run, but it does not restrict who can push directly to `main` or require that every change go through a PR. This is necessary, not an oversight: the curation pipeline commits video removals directly to `main` as part of its same-day-takedown commitment, and some ordinary maintainer commits also land on `main` directly. A direct push still triggers CI afterward (the same workflow runs on `push` to `main`), so a break is still detected and surfaced — via the standing health-tracking issues — but it cannot be prevented the way a PR merge can be. The alternative, also restricting direct pushes so CI could truly gate everything, was rejected because it would require redesigning the curation pipeline's removal path, which is out of scope here.
