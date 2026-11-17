---
status: accepted
---

# Add a narrow, first-party, anonymous per-channel viewership signal for curation prioritization

**Context:** ADR 0008 rejected third-party client-side observability outright and said any client-side observability should be "its own deliberate decision with its own trade-off discussion, not a rider on ops tooling." This is that discussion. The need: know which Channel (the app-side themed category defined in `channels.yaml`, not a YouTube channel) viewers actually watch, to prioritize curation effort. YouTube's own public view counts can't answer this — they're aggregated across every embed of a video everywhere on the internet, not scoped to plays inside this app.

**Decision:** Add a first-party, anonymous, aggregate-only viewership counter, narrowing rather than reversing ADR 0008's stance. The app posts a count-increment to a Cloudflare Worker (backed by Workers KV) only after a Channel's YouTube IFrame player reports sustained playback (~10-15s), not on bare row selection — this keeps the signal to real watches, not accidental taps. The signal carries no cookie, fingerprint, or cross-session identifier of any kind; only a channel ID and that a watch happened. A weekly snapshot of the counts is committed to git (under `curation/`, not `docs/`) riding the existing `curate.yml` Action's cadence, rather than a live dashboard or database. The Worker does basic Referer validation against the app's own origin and nothing heavier. The About page gets a one-line disclosure of this anonymous counting.

**Considered Options:**
- *Self-hosted analytics tool (Umami/Plausible/GoatCounter)*: rejected — requires running and maintaining a persistent server and, for most of them, a database indefinitely, against this project's existing preference for thin, managed pieces over operated infrastructure (see `curation/ARCHITECTURE.md`'s "why this isn't a database").
- *Hosted third-party analytics, even a privacy-focused free tier*: rejected outright — still a network call from a viewer's browser to a party other than this project, exactly what ADR 0008 forbids.
- *Relying on YouTube's own view counts*: rejected — wrong unit of measurement; a Channel here is an app-side grouping, and YouTube's counts don't distinguish plays that happened inside this app from plays anywhere else.
- *Vercel, Netlify, or Deno Deploy instead of Cloudflare Workers*: rejected — Vercel's free tier forbids commercial use, Netlify's free tier is a less-predictable shared-credit system, and Deno Deploy's free plan was mid-migration (Classic deprecated July 2026) with full limits gated behind a credit card. Cloudflare Workers + KV needs no card and has the most predictable flat quota (100K requests/day; KV capped at 1,000 writes/day, accepted as a limit to revisit only if actually hit).
- *A live dashboard, mirroring the Curation review dashboard (ADR 0013)*: rejected — nobody but the owner needs to see this, and reading a committed JSON file/diff costs nothing to build.

**Consequences:**
- This repo is public, so the weekly counts are visible to anyone via git history regardless of which directory they live in — accepted because the data is aggregate and anonymous, the same risk class as publishing view counts. Keeping the file out of `docs/` only avoids serving it as part of the live site; it does not make it private.
- Cloudflare Workers KV's free tier caps writes at 1,000/day; if the app is ever popular enough to exceed that, the fix is batching writes or a different store, not something to engineer against pre-emptively.
- Any future want for session-level, per-viewer, or time-of-day detail is explicitly out of scope here and would need its own trade-off discussion, same as this one was for ADR 0008.
