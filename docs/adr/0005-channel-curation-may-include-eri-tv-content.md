---
status: accepted
---

# A channel's curation rule may include Eri-TV's own uploads

The channel-demand research (`docs/research/channel-demand-signals.md`) flagged News and Sports as "saturated" on the grounds that Eri-TV, the dominant incumbent Eritrean broadcaster, already produces daily news and already covers marquee cycling events. Owner decision (2026-11-02): that doesn't disqualify a category. NahomEriTV's curation model (Weddings, Kebire) already works by aggregating *other people's* public YouTube uploads into a themed, scheduled lineup — it has never depended on being a category's only source — so a candidate channel's curation rule (a search query, or a single-source `type: channel` rule) is free to surface Eri-TV's own relevant uploads alongside or instead of other creators', the same as it would any other public, embeddable video. "An incumbent already covers this well" should shape *how* a channel's rule gets built — e.g. a `type: channel` rule pointed directly at Eri-TV, the same single-source pattern ADR-0004 already uses for News — not whether the category is worth pursuing.
