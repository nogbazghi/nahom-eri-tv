# TV Guide & Multi-Channel — Design Document

Oct 31, 2026 · Owner: @Nahom

This extends **Nahom Eri TV — Design Document v1**: one new channel (Kebire), and the channel-switcher UI that v1 deliberately deferred to M5. It assumes v1's architecture, data model, and curation philosophy (no pre-publish review, saved rule + reactive block list) as given — only what's new or changed is described here.

## Overview

Two changes, decided together because the switcher only makes sense once a second channel exists:

1. **A new channel**, Kebire — one creator's travel/landscape content about Eritrea, not a search-driven pool like Weddings.
2. **A channel switcher** so a viewer can move between channels, each still playing as its own independent broadcast.

## Kebire channel

Prompted by [this video](https://www.youtube.com/watch?v=un4pHBAkIag) — "Join me on a country side ride in Eritrea's beautiful mountain landscape," by the channel Kebire.

**Rule:** every public, embeddable video from Kebire's channel whose title or description contains `#eritrea` (case-insensitive substring match) — not his entire catalog, since he posts about other places too.

**No 1,000-view minimum.** That threshold exists in v1 to de-risk an unvetted pool of many strangers' channels surfaced by a keyword search. It doesn't apply here — this is one specific, chosen creator's own channel, not a stranger pulled in by a query.

**No outreach or permission required before launch.** Same "no pre-publish gatekeeping" philosophy v1 already applies to Weddings. This is a deliberate departure from v1's channel-lineup table, which had originally sketched this channel type ("Creator shows") as "creator opt-in" — that framing is dropped for Kebire. The only safeguards are the same ones every channel has: public + embeddable only, and the reactive block list.

**Curation script:** a new `curation/kebire_channel.py`, separate from `discover.py`. `discover.py`'s rule type is "keyword search across many channels"; this rule type is "every upload from one known channel ID, filtered by a hashtag match" — a fundamentally different retrieval call (the channel's uploads playlist, not `search.list`). It reuses `fetch_metadata.py`'s helpers (`parse_duration`, duration/embeddable lookup) the same way `discover.py` does.

## TV Guide / channel switcher

**Not a full programming-grid guide.** With 2 channels, a grid showing channels × what's-currently-playing is more interface than the information warrants. A simple row of channel-name buttons does the same job.

**Autoplay stays the default behavior.** The page loads and immediately plays the default channel — the switcher is a visible secondary control, not a screen the viewer has to get past first. This preserves v1's core promise: tune in, don't pick anything.

**Each channel is its own independent broadcast.** Switching to Kebire and back to Weddings resumes Weddings wherever its own schedule says "now" is — channels don't share a clock or a position.

**Generic for N channels.** The switcher reads the channel list from the data file rather than being hardcoded to "Weddings | Kebire," so adding a third channel later is a data change, not a UI change.

**Selected channel is reflected in the URL** (query string) so a specific channel is shareable/bookmarkable directly.

**Default channel is marked in the data, not hardcoded in `app.js`** (see Data model changes, below) — keeps with the generic-UI principle. Weddings stays the default for now, since it already has real launch activity underway.

## Data model changes

`docs/data/videos.json` is extended, not replaced. The flat `videos` array stays exactly as v1 defined it — same fields, `channels[]` still computed from each channel's own rule and never hand-edited. What's new is a top-level `schedules` map, one entry per channel, replacing the single global `scheduleStart`:

```json
{
  "videos": [
    {
      "id": "YaQd8H6rdm4",
      "title": "Eritrean Wedding",
      "channel": "MelayVideo",
      "language": "Tigrinya",
      "city": "",
      "tags": ["wedding"],
      "published": "2024-07-29",
      "duration": 1135,
      "channels": ["Weddings"],
      "notes": ""
    },
    {
      "id": "un4pHBAkIag",
      "title": "Join me on a country side ride in Eritrea's beautiful mountain landscape",
      "channel": "Kebire",
      "language": "",
      "city": "",
      "tags": ["eritrea"],
      "published": "2026-09-01",
      "duration": 612,
      "channels": ["Kebire"],
      "notes": ""
    }
  ],
  "schedules": {
    "Weddings": { "scheduleStart": "2026-10-31T19:18:56Z", "default": true },
    "Kebire": { "scheduleStart": "2026-11-01T00:00:00Z" }
  }
}
```

No per-channel file split, and no duplicated video objects — a video belonging to more than one channel (not expected soon, but possible) still appears once in the flat pool, with both names in its `channels[]`. The front-end filters the pool by channel membership to get that channel's lineup and duration total, and computes elapsed time against that channel's own `schedules[name].scheduleStart` — same math v1 already uses, just scoped per channel instead of globally.

**Existing scripts must change from overwrite to merge.** `fetch_metadata.py` and `discover.py` currently read the whole file (if present) only to carry over `scheduleStart`, then overwrite the entire `videos` array. Both need to become read-merge-write: each script only replaces entries whose `channels` is exactly `["Weddings"]`, leaving any other channel's videos in the pool untouched, and only writes `schedules["Weddings"]`, leaving other channels' schedule entries alone. (Tracked as a separate implementation task — not done in this document.)

## Open questions

None outstanding — every decision above was confirmed directly. If a third channel is added later, revisit whether the simple tab switcher still fits or a real guide-grid becomes worth it (see TV Guide / channel switcher, above).
