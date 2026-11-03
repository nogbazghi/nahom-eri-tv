---
status: accepted
---

# News sidesteps a written editorial policy by using a single-source curation rule

v1 requires a written editorial policy (approved sources, handling opposing views, who rules on disputed content) before any news/politics channel ships, given how politically divided the diaspora is. Rather than writing that policy, a News channel instead uses a `type: channel` curation rule — enumerating one chosen source's own uploads, the same pattern as Kebire — instead of an open `type: search` rule that could pull in multiple outlets with conflicting editorial stances. A single source sidesteps "who decides what counts as approved" and "how are opposing views handled" by construction: there's only one voice, so there's nothing to arbitrate between. This is a narrower guardrail than a full written policy, not a replacement for one — if a second news source or any multi-outlet aggregation is considered later, the written-policy requirement from v1 is back in force.
