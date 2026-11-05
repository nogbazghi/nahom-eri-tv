## Development workflow

All new feature/dev work in this repo goes through the `/ask-matt` skill flow — this is a hard requirement, not ad-hoc grilling and hand-written tickets:

1. `/grill-with-docs` — interview to sharpen the design, writing `GLOSSARY.md`/ADRs as decisions are made.
2. `/to-spec` — synthesize the conversation into a formal spec, published to the issue tracker.
3. `/to-tickets` — break the spec into vertical-slice tracer-bullet tickets, published to the issue tracker.
4. `/implement` (per ticket) or `/implement-spec` (whole spec, parallel across the ready frontier).
5. `/code-review` as part of implementation (Standards + Spec, two axes).
6. `/retro` after a build, especially one that went sideways.

This applies in every worktree, not just the primary checkout — `/setup-matt-pocock-skills` has already been run for this repo (issue tracker, triage labels, and domain-doc layout are configured below).

## Agent skills

### Issue tracker

Issues live as GitHub Issues on `nogbazghi/nahom-eri-tv`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical roles (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout (one `GLOSSARY.md` + `docs/adr/` at the repo root). See `docs/agents/domain.md`.
