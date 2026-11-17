---
status: accepted
---

# No third-party client-side observability (analytics, error tracking) is added as part of CI/CD and pipeline-observability work

This effort's observability scope is deliberately limited to the curation pipeline's own operational health (did a run succeed, fail, or exhaust API quota) — it does not add any analytics or error-tracking script to the viewer-facing app that would phone data out from a viewer's browser to a third party. This mirrors the project's existing posture of avoiding third-party network dependencies in the shipped app (ADR 0006 self-hosts fonts for a different reason — offline reliability — but the same zero-external-dependency instinct applies here for privacy and dependency-purity reasons). The alternative — adding a free-tier tool like Sentry or GA now, since it's cheap and the opportunity is right there — was rejected: it's exactly the kind of low-visibility way a privacy-sensitive default erodes without anyone deciding it should. If client-side observability is ever wanted, it should be its own deliberate decision with its own trade-off discussion, not a rider on ops tooling.

**Note (see [ADR-0014](./0014-first-party-anonymous-viewership-counting-for-curation.md)):** that deliberate decision was made for a narrow case — anonymous, first-party, aggregate-only per-channel viewership counting, to inform curation prioritization. The "no third party" stance here still holds in full; only "no observability at all" was narrowed, and only for that one signal.
