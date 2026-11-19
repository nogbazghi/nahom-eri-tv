---
status: accepted
---

# The curation review dashboard authenticates with a client-side GitHub PAT, not a backend service

The Curation review dashboard (`docs/curation-review-ui.js` et al.) is used by exactly one reviewer — the project's owner — so it authenticates with a fine-grained GitHub personal access token, scoped to just this repository (`contents` + `pull-requests`, read/write), entered once and kept in the browser's `localStorage`. GitHub's REST API is called directly, client-side; there is no backend service of any kind.

## Considered Options

- **A backend service holding a real GitHub App/OAuth App installation token.** Rejected: this is the standard way to support multiple reviewers with per-person attribution, but building, hosting, and securing a service is real ongoing cost that a single-reviewer tool doesn't justify.
- **Leave review as GitHub's native whole-PR merge-or-close flow (no dashboard at all).** Rejected: this is the actual problem this dashboard exists to solve — PR #13 showed that merge-everything-or-close-everything throws away genuinely good additions alongside bad ones, with no way to keep the good ones without a code fix to the underlying search rule.
- **A fine-grained PAT kept client-side (chosen).** Scoped to just this repo, so a compromised token can't reach anything beyond this project; no service to build or host; the obvious fit for exactly one authorized reviewer.

## Consequences

If this project ever needs multi-reviewer support or per-reviewer attribution, this decision should be revisited — that would need a proper OAuth App, not an extension of the client-side PAT approach.
