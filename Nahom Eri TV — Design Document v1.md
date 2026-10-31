# Nahom Eri TV — Design Document

Oct 31, 2026 · Owner: @Nahom

## Overview

Nahom Eri TV is a streaming-style channel that plays Eritrean and Tigrinya-language videos from YouTube as one continuous lineup, broadcast-style: every viewer who tunes in sees the same video at the same point, computed from a fixed schedule, rather than their own playlist starting over from video one. Viewers tune in and watch, and do not have to search or pick videos. The first channel is Eritrean weddings.

The service does not download or rehost any media. Every video plays from YouTube through its official embed player, so creators keep their views, ads, and control of their uploads.

The main problem is curation. Eritrean diaspora video is scattered across YouTube, TikTok, Reddit, and archive.org, and nothing organizes it by community interest. This service keeps curation lightweight with a saved selection rule plus a reactive takedown process — there is no per-video human approval step before a video goes live.

## Goals and non-goals

Goals:

1. Run a pilot wedding channel that plays a small, hand-picked set of public Eritrean wedding videos as one continuous, broadcast-style lineup.
2. Keep curation lightweight as the library grows, using an automated search rule plus a reactive block list, with no per-video manual review.
3. Make it easy to add, remove, or block a video without editing code.

Non-goals:

- Downloading, storing, or re-serving video files.
- Playing copyrighted music without clearance.
- Taking a political side in news content.
- Proactively reviewing every video for guest privacy before it airs. (See Takedowns, moderation, and privacy — this is a deliberate trade-off, not an oversight: the pilot favors low curation overhead over pre-publish review, and relies on an automated view-count filter plus fast takedown response instead.)

## Audience and viewing scenarios

Primary viewers are diaspora Eritreans and Tigrinya speakers who want to see their community's weddings, music, and celebrations without searching for them.

Scenarios:

- A viewer abroad who wants to see a cousin's wedding style or a city's wedding traditions while having coffee.
- A family planning a wedding who wants ideas for music, dress, and ceremony.
- A younger viewer who wants to see how wedding traditions look in the diaspora.
- A creator or videographer who wants their work seen by a wider audience, with credit.

## Channel lineup

The pilot is one channel. The others are candidates, each with a viewer promise and a curation rule. A channel is a saved rule (for example, language is Tigrinya, tag is wedding, published after 2020) plus a block list maintained by hand — there is no approve list.

| Channel | Viewer promise | Curation rule | Rights risk |
| --- | --- | --- | --- |
| Weddings (pilot) | Eritrean and Tigrinya weddings from around the diaspora | Search rule (tag, language) plus a 1,000-view minimum; no source vetting | No proactive vetting, mitigated by the view-count filter and fast takedown |
| Language | Content in Tigrinya, Tigre, Arabic, or English | Language tag | Depends on content |
| Places | Weddings and life in Asmara, Stockholm, Toronto, Washington | City tag | Depends on content |
| Generations | Elders, second generation, youth | Manual tags | Depends on content |
| Events | Independence Day, Martyrs' Day, sports | Date windows | Low for event footage |
| Creator shows | One trusted creator's work | Creator opt-in | Low, with permission |
| Community picks | Viewer-voted content | Submissions with editor approval | Needs moderation |

Open question: whether any channel presents news or politics, which needs an explicit editorial decision (see the editorial stance section).

## Content sourcing and curation

Sources: YouTube first, using the YouTube Data API to find public, embeddable videos. TikTok and Reddit are added later, one linked post at a time, because they have no open feed suitable for this.

**Pilot bootstrap:** a small, hand-picked set of video IDs (initially 5–10), selected directly rather than discovered by a script. A helper script fetches title, duration, and embeddable status for those IDs from the YouTube Data API. Language, city, and channel membership are entered by hand at this scale.

**Automated discovery (later milestone):** a per-channel search rule (tag, language, date window) finds candidates automatically. A video qualifies if it is public, embeddable, and has at least 1,000 views. Videos are pulled from any channel that matches the rule — there is no trusted-channel allow-list and no per-video review before a video goes live. A video is tagged with the language and city of the search query that found it.

Rule: a video is excluded only if it is not public, not embeddable, or on the block list. There is no approval step.

## Curation model

Each channel is defined by a saved search rule and a block list. The rule selects and includes candidates automatically; nobody pre-approves a video. The block list removes videos that are taken down, disputed, or flagged after a takedown request.

Channel membership (`channels`) is always computed from the rule at curation time — it is never hand-edited, so it can't drift out of sync with the rule.

The block list is a short YAML file in the repository (`curation/blocklist.yaml`), edited directly through GitHub's web interface so a non-developer can exclude a video without touching code, git, or a spreadsheet.

## Architecture

The pilot is a static site with no backend and no CI. Repository layout:

```
/curation/        scripts, blocklist.yaml
/docs/            index.html, app.js, style.css   ← served by GitHub Pages
  /docs/data/     videos.json (generated or hand-edited, committed)
```

Components, in the order data flows:

1. **Curation inputs** (`curation/blocklist.yaml`, hand-edited). For the pilot, video IDs are hand-picked rather than discovered.
2. **Curation script** (Python, run locally by hand — no scheduled automation yet). For the pilot, it takes a short list of hand-picked video IDs and fetches title, duration, and embeddable status from the YouTube Data API. Later, it runs a per-channel search query, applies the 1,000-view filter and the block list, and tags results by the search query's language and city.
3. **`videos.json`** (committed to `/docs/data/`). One file holding every video's metadata, including duration in seconds and computed `channels[]` membership, plus a single top-level `scheduleStart` timestamp for the whole lineup. The front-end filters this client-side if and when more than one channel exists.
4. **Static page** (`/docs/index.html`, `/docs/app.js`, `/docs/style.css` — plain HTML/CSS/JS, no framework or build step). Loads `videos.json`, creates one YouTube IFrame Player, and computes playback position from the shared broadcast schedule (below).
5. **YouTube IFrame API.** Streams the video and handles ads, branding, and playback. The service stores no media.
6. **Hosting** (GitHub Pages, serving `/docs` directly off `main`). No CI step — pushing a commit is the deploy.

No user accounts, databases, or server-side code. The page stores no personal data.

### Shared broadcast scheduling

The lineup behaves like a real channel: every viewer who loads the page sees the same video at the same point, not their own playlist starting from video one. `videos.json` carries a `scheduleStart` timestamp, written once the first time the file is generated and never changed on later regenerations, even as videos are added or removed. On load, the page computes:

```
elapsed = (Date.now() - scheduleStart) mod totalDuration
```

and finds which video and offset that elapsed time falls into, using each video's stored duration. There is no shuffle control — order is simply the order videos appear in `videos.json`; reordering is a manual edit, not a viewer-facing feature. A channel switcher is deferred until a second channel exists (see Milestones).

### Error handling

If the IFrame player fires `onError` (a video was removed, geo-blocked, or had embedding disabled after the fact), the page silently advances to the next video in the lineup — no visible error state.

### Autoplay

The player starts muted on load, with a visible tap-to-unmute control, so playback isn't blocked behind a click but still respects browser autoplay restrictions.

### Attribution

The creator's name and a link to their channel appear in a simple text block below the player — not as an on-screen overlay during playback.

## Data model

Each video is one entry in `videos.json`.

| Field | Example | Purpose |
| --- | --- | --- |
| id | YouTube video ID | Playback |
| title | Wedding title | Display |
| channel | Videographer name | Attribution |
| language | Tigrinya | Language channel rule / display |
| city | Stockholm | Places channel rule |
| tags | wedding, music | Channel rules |
| published | 2024-06-14 | Date rules |
| duration | 2745 | Shared broadcast scheduling |
| channels | Weddings | Computed from the rule — never hand-edited |
| notes | Free text | Optional context |

`videos.json` also carries one top-level `scheduleStart` timestamp shared by the whole lineup (see Architecture).

`curation/blocklist.yaml` holds excluded video IDs separately, with a reason and date. A blocked video is removed from `videos.json` entirely rather than marked with a status field.

A channel definition holds a name, a viewer promise, and a rule expressed as tag, language, city, and date filters.

## Takedowns, moderation, and privacy

Takedown: any removal request, from a creator or platform, adds the video to `curation/blocklist.yaml` the same day and removes it from `videos.json`. Record the reason and date.

Privacy: the service does not show personal details beyond what the creator published. The pilot does not review videos individually or vet channels before they appear — the search rule, the 1,000-view minimum filter, and the block list are the only safeguards. This is a deliberate trade-off: it keeps curation overhead low, at the cost of not proactively catching cases where wedding guests appear identifiably and may not have consented to the upload. Fast takedown response is the primary remedy once such a video is flagged, not prevention.

Retention: the service stores no viewer data in the pilot. If analytics are added later, they must be aggregate and must not record identities.

Contact: **currently none** — the pilot launches with no visible contact method on the page (owner decision, 2026-10-31: no address to publish yet). This is a real gap, not a minor one: it's the only safeguard this design relies on given there's no pre-publish content review (see Privacy, above). The 48-hour response target below cannot be met by anyone who has no way to reach the owner. Add a real address (and reinstate the footer line in `docs/index.html`) before or very soon after soft launch (ticket 008 in `/tickets/`).

Response target once a contact exists: within 48 hours.

## Editorial stance on politics and sensitive content

Eritrean diaspora communities are deeply divided, and any channel that looks like news will be read as taking a side. The default for the pilot is to avoid politics entirely and keep content to weddings, culture, and community life.

If a news or politics channel is added later, it needs a written editorial policy before launch. The policy should cover what counts as an approved source, how opposing views are handled, and who makes calls on disputed content.

Sensitive content, including violence, detention, and personal testimony, is excluded from the pilot. Any future inclusion requires a separate review and the subject's consent where possible.

## Analytics and success metrics

The pilot succeeds if the lineup plays continuously without manual intervention, and if viewers stay past their first video.

| Metric | Target for pilot | Source |
| --- | --- | --- |
| Videos in the lineup | 30 or more | `videos.json` |
| Share of videos playing without error | 90% or more | Player error events |
| Average watch time per visit | 10 minutes or more | YouTube player events, aggregated |
| Creators notified as a courtesy | Best effort, non-blocking | Outreach log |
| Takedown requests answered within 48 hours | 100% | Contact log |

Analytics stay aggregate and anonymous. No viewer identities are stored.

## Risks and mitigations

1. **Copyright claim on a video.** Mitigation: the view-count filter, a block list, and a same-day takedown process. There is no pre-publish permission step.
2. **Platform changes embed rules or removes a video.** Mitigation: the page skips unplayable videos (`onError` auto-advance) and `videos.json` is regenerated regularly.
3. **Wedding guests object to appearing.** Mitigation: no proactive exclusion in the pilot — mitigated only by the 1,000-view filter and a fast, same-day takedown response once a video is flagged.
4. **Channel is read as political.** Mitigation: keep the pilot to culture, and write an editorial policy before any news channel.
5. **Curation takes too long.** Mitigation: an automated search rule plus a view-count filter removes the need for per-video or per-channel review.
6. **Music rights.** Mitigation: no copyrighted music in the pilot. Music channels wait for clearance.
7. **Viewers expect TikTok or Reddit content.** Mitigation: state the scope on the page, and add those sources only as linked posts.

## Milestones

- **M1: Pilot data.** Hand-pick 5–10 wedding videos. Run the metadata-fetch script to pull duration and embeddable status, and fill in language/city/channel by hand into `videos.json`.
- **M2: Pilot page.** Build `index.html`/`app.js`/`style.css` with the shared broadcast schedule, muted autoplay, and auto-skip on error. Publish via GitHub Pages. Test on desktop and mobile.
- **M3: Soft launch.** Share with a small group of viewers and creators. Notify featured creators as a courtesy. Track the success metrics for two weeks.
- **M4: Automated discovery.** Build the per-channel search script (view-count filter, tag-by-query for language/city), replacing hand-picking.
- **M5: Second channel.** Choose from the lineup (language or places) based on pilot results, write its curation rule, and add the channel switcher.

Dates are not yet set. See Open questions.

## Open questions

- [x] Will the channel have a name in Tigrinya as well as English?
  **Deferred** — not required for pilot launch. Candidates from earlier research, for whenever this gets picked up (none native-speaker-verified yet):
  - **መርዓ ኤርትራ** (*Mer'a Ertra*, "Eritrean Wedding(s)") — plain and descriptive.
  - **ናሆም ኤሪ ቲቪ** (*Nahom Eri TV*, transliterated) — keeps one brand recognizable across both languages.
  - **ኣኼባ መርዓታት** (*Akheba Mer'atat*, roughly "a gathering of weddings") — more evocative, less literal; least confident of the three.
- [x] Which contact address goes on the page for takedown requests?
  **Owner decision (2026-10-31): none for now.** The pilot launches with no contact method rather than a placeholder/broken address. See Takedowns, moderation, and privacy, above, for why this is a real gap, not a formality.
- [x] If creator outreach happens as a courtesy (M3), is a simple email reply enough to record, given it's no longer a precondition for inclusion?
  **Yes** — a line in the outreach log or the video's `notes` field is enough. It's a relationship-building courtesy, not a compliance record, so it doesn't need a signed form or dedicated tracking.
- [x] What is the first date for a soft launch?
  **~2026-11-24**, as a working target (reasoned from the M1/M2 timing estimate) — adjust once ticket 010 is actually being scheduled, not a hard commitment.
