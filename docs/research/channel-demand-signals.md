# Channel Demand Signals: Religion vs. Music-per-Decade vs. Podcasters vs. News vs. Sports vs. National Holidays

**Decision this informs:** which new content channel(s) NahomEriTV should add to the network.

**Scope:** Eritrean diaspora audiences and Tigrinya-language search/content behavior specifically — **not** the broader Horn of Africa and **not** Ethiopia-general content. Where a query or channel turned out to be dominated by Ethiopian (incl. Tigray) rather than Eritrean signal, that is flagged explicitly below rather than folded into the Eritrea numbers.

**Research date / access date for all sources:** 2026-11-01, except the Sports section (§5) and the National Holidays section (§6), plus both sections' fold-in to the comparison table, which were added in follow-up research passes with an access date of 2026-11-02, and the Church seminar/teaching content section (§8), plus its fold-in to the comparison table, which was added in a further follow-up research pass with an access date of 2026-11-03 — each source line below states its own access date explicitly.

**Convention note:** `docs/research/` does not previously exist in this repo and no prior research-notes convention was found in `docs/agents/` (checked `domain.md`, `issue-tracker.md`, `triage-labels.md`). This file establishes that convention; it is not backed by an existing template.

---

## Methodology (read before the numbers)

- **Google Trends** (`trends.google.com`): directly requesting the human-facing Explore page (`/trends/explore?...`) from this environment returned **HTTP 429 (Too Many Requests)** on every attempt, via both the WebFetch tool and `curl`, even with browser-like headers and retries/backoff. This is a documented anti-scraping block, not a per-query failure.
  - **Workaround used:** the Explore page itself calls a JSON backend (`trends.google.com/trends/api/explore` and `.../trends/api/widgetdata/{multiline,comparedgeo,relatedsearches}`). After seeding a session cookie via a plain GET to `trends.google.com/trending`, these JSON endpoints returned real **HTTP 200** data. All Google Trends numbers below come from these JSON responses — i.e. the same backend the Explore UI itself renders, not an estimate or a secondary source. Raw values are Google's own 0–100 relative-interest index.
  - **Important normalization caveat:** Trends only normalizes values to 0–100 *within a single comparison request*. Numbers are directly comparable **within the same job** (e.g. the 5 religion terms queried together, or the 4 cross-category terms queried together) but **not** comparable across different jobs run separately. This is called out per-table below.
  - Time window for all queries: `today 5-y` (trailing 5 years from access date), weekly resolution, worldwide geo unless noted.
  - Related-queries/related-topics widgets came back as an empty `rankedKeyword` list for **every single term tested** (9/9 single-term explore calls) — Trends is explicitly reporting these terms are below its volume threshold for that breakdown. This is reported as "no related-queries data" rather than invented.
  - Per-country GEO_MAP breakdowns for low-volume terms are noisy: a single tiny country can show index `100` off essentially one or two searches (e.g. Tuvalu, Cape Verde). These are flagged as low-confidence/ignored in favor of the named diaspora hubs (US, DE, SE, IL, GB, SD, ET, CA, NL, IT, ER).
- **YouTube** (`youtube.com`): search-results pages and channel "About" pages are server-rendered with an embedded `ytInitialData` JSON blob, which `curl` successfully retrieved (HTTP 200) without needing JS execution. Subscriber counts, video counts, view counts, and relative upload recency below were parsed directly out of that JSON — not estimated. Search result ranking/ordering reflects YouTube's own relevance ranking at access time, not a controlled comparison.

---

## 1. Religion (Orthodox / Catholic / Protestant)

### Summary
Of the three, **Orthodox (EOTC/Tewahedo) content is by far the best-evidenced demand AND the most saturated supply.** Catholic has a faint, thin signal and thin-but-present supply with stale content. Protestant/Evangelical has **no measurable Google Trends signal at all** and YouTube supply limited to hyper-local, low-reach individual-church livestreams.

### Google Trends

**Job: 5-way compare — `Eritrean Orthodox`, `Eritrean Catholic`, `Eritrean Protestant`, `Eritrean Evangelical`, `EOTC`** (these 5 numbers are directly comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Eritrean Orthodox | 9.3 | 26 (Apr 5–11, 2026) | 0.0% | 8.4 → 10.1 (+20%, rising) |
| EOTC | 10.2 | 100 (Feb 5–11, 2023) | 0.0% | 9.5 → 10.9 (+15%, flat/rising) |
| Eritrean Catholic | 0.1 | 5 (Jun 14–20, 2026) | 95.8% | 0.1 → 0.2 (thin, off a near-zero base) |
| Eritrean Evangelical | 0.0 | 3 (Aug 21–27, 2022) | 99.6% | ~0 → ~0 (no measurable signal) |
| Eritrean Protestant | 0.0 | 0 | 100% | **zero search volume for the full 5 years** |

Standalone (single-term) re-runs confirm these: `Eritrean Orthodox` alone averages 35.4 (max 100 at Apr 5–11, 2026, slight rise 32.4→38.4); `Eritrean Catholic` alone averages 2.5 (max 100 at Jun 14–20, 2026, 95.8% zero weeks); `Eritrean Protestant` alone returned a **completely empty timeline** (`timelineData: []`) — Trends has no data for this exact phrase at all.

**Geo breakdown (`Eritrean Orthodox` standalone):** Eritrea = 45, Ethiopia = 1, every other diaspora hub (US, DE, SE, IL, GB, SD, CA, NL, IT) = 0 on this term specifically in the geo widget (search is concentrated, not broadly spread) — **clean Eritrea-specific signal** with essentially no Ethiopia contamination.

**Important caveat on Tigrinya/Ge'ez-script and `EOTC` terms:** `EOTC` geo breakdown is ER=100, ET=51 — meaningfully Ethiopia-contaminated, since "EOTC" is also the common initialism for the much larger Ethiopian Orthodox Tewahedo Church. The Tigrinya-script terms are **worse**: `ኦርቶዶክስ ተዋህዶ` geo breakdown is **ET=100, every other country including Eritrea = 0** — this script query is being driven almost entirely from inside Ethiopia, not the Eritrean diaspora. `ተዋህዶ ቤተ ክርስትያን` has almost no volume at all (avg 0.2, 99.2% weeks zero). **Net finding: searching in Ge'ez/Tigrinya script does not isolate Eritrean-specific demand for this topic — the clean signal comes from the English qualifier "Eritrean Orthodox."**

No related-queries data available for any of the 5 terms (empty result set from Trends).

### YouTube

**Orthodox (Tewahedo/mezmur) — well supplied, high reach:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Medlote Amin መድሎተ ኣሚን | 104K | 352 | recent video 242,983 views (5mo ago), another 209,193 views (11mo ago) |
| Zemari Bereket Tikue | 139K | 111 | individual mezmur videos at 1.86M and 5.74M views |
| Eritrean Orthodox Tewahdo ቤት ፍቕሪ እግዚኣብሄር | 130K | ~1,000 | daily-prayer video at 3.32M views |
| fnote brhan | 39.5K | 91 | mashup video at 956,592 views |
| AFDEGE BRHAN ኣፍደገ ብርሃን (EOTCDebregenetEdmonton) | 30.5K | 64 | one mezmur video at 4.48M views |
| ናይ ኤርትራ ኦርቶዶክስ ተዋህዶ ቤተ-ክርስቲያን ኪዳነምሕረት ኣቡዳቢ UAE | 36.5K | — | diaspora-parish (Abu Dhabi) channel |
| ቤተ ልሔም (Bietelhiem) | 16.6K | 42 | mezmur video at 3.14M views |
| Zion-Tube | 15.1K | 310 | daily-prayer content, 292,976 views on one clip |

Multiple individual mezmur videos sit in the **1M–5.7M view** range, and several channels post new content within the last 1–5 months (e.g. Medlote Amin's newest video is 1 month old; "ዋይዜማ (WayZema) and Zemarit Tirhas" posted a mezmur 1 day before access). This is the single most saturated and highest-reach sub-niche across all four verticals and all three religion sub-cases.

**Catholic — thin, legacy-heavy:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Mezmur Catholic | 33.3K | 346 | top video 515,052 views, but catalog is **9–13 years old** |
| Eritrean Catholic Charismatic Renewal | 5.46K | ~1,600 | active live-streamer (streams "4h ago", "1d ago") but each stream only 4K–5K views |
| Tesfaldet Gebremedhin (catholicmezmur5540) | 4.23K | 48 | legacy uploads, 9–13y old, up to 407K views |
| Eri Maranatha Jesus (Switzerland) | 1.68K | 134 | event-recap videos, 8K–103K views |

Subscriber counts are an order of magnitude below the top Orthodox channels, and the highest-view-count Catholic content is a decade or more old — the catalog is not being actively refreshed by a well-subscribed creator.

**Protestant/Evangelical — most fragmented, lowest reach:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Gospel Light Baptist Eritrean Church Dallas | 8.05K | ~1,000 | live Sunday-service streams, views in the hundreds |
| Philadelphia Eritrean Evangelical Church | 4.57K | ~1,100 | Sunday-service streams, 87–953 views per video |
| Eritrean evangelical lutheran church North America | 1.99K | 495 | recent upload (4w ago) at 687 views |
| EritreanChurchDC | 1.45K | 259 | legacy videos (15–16y old) at 6K–25K views |
| Philadelphia Eritrean Evangelical Church Tulsa OK | 616 | — | one live-stream had **"No views"** at time of capture |

Every Protestant/Evangelical channel found is a **single congregation's own livestream channel** — there is no cross-congregation, dedicated-media-brand equivalent of "Medlote Amin" or "Mezmur Catholic" for this sub-case. View counts per video are consistently in the tens to low thousands, versus hundreds of thousands to millions for Orthodox mezmur content.

### Sources (Religion)
- Trends API (religion 5-way compare), accessed 2026-11-01: `https://trends.google.com/trends/api/explore?hl=en-US&tz=-60&req={"comparisonItem":[{"keyword":"Eritrean Orthodox","geo":"","time":"today 5-y"},{"keyword":"Eritrean Catholic","geo":"","time":"today 5-y"},{"keyword":"Eritrean Protestant","geo":"","time":"today 5-y"},{"keyword":"Eritrean Evangelical","geo":"","time":"today 5-y"},{"keyword":"EOTC","geo":"","time":"today 5-y"}],"category":0,"property":""}` (human-facing equivalent: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox,Eritrean%20Catholic,Eritrean%20Protestant,Eritrean%20Evangelical,EOTC&hl=en-US`, returns HTTP 429 to automated fetches — see Methodology)
- Trends API (Tigrinya-script religion compare `ተዋህዶ ቤተ ክርስትያን` vs `ኦርቶዶክስ ተዋህዶ`), accessed 2026-11-01: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=%E1%89%B0%E1%8B%8B%E1%88%85%E1%8B%96%20%E1%89%A4%E1%89%B0%20%E1%8A%AD%E1%88%AD%E1%88%B5%E1%89%B2%E1%8B%AB%E1%8A%95,%E1%8A%A6%E1%88%AD%E1%89%B6%E1%8B%B6%E1%8A%AD%E1%88%B5%20%E1%89%B0%E1%8B%8B%E1%88%85%E1%8B%96&hl=en-US`
- Trends API (standalone `Eritrean Orthodox`, `Eritrean Catholic`, `Eritrean Protestant`, `EOTC`), accessed 2026-11-01: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox`, `...q=Eritrean%20Catholic`, `...q=Eritrean%20Protestant`, `...q=EOTC`
- YouTube search, accessed 2026-11-01: `https://www.youtube.com/results?search_query=Eritrean+Orthodox+Tewahedo`, `https://www.youtube.com/results?search_query=%E1%8A%A6%E1%88%AD%E1%89%B6%E1%8B%B6%E1%8A%AD%E1%88%B5%20%E1%89%B0%E1%8B%8B%E1%88%85%E1%8B%96%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB` (ኦርቶዶክስ ተዋህዶ ኤርትራ), `https://www.youtube.com/results?search_query=Eritrean+Catholic`, `https://www.youtube.com/results?search_query=Eritrean+Protestant+church`, `https://www.youtube.com/results?search_query=Eritrean+Evangelical`
- YouTube channel About pages, accessed 2026-11-01: `https://www.youtube.com/@medloteamin/about`, `https://www.youtube.com/@zemariberekettikue_24/about`, `https://www.youtube.com/@eritreanorthodoxtewahdo9532/about`, `https://www.youtube.com/@fnotebrhan4943/about`, `https://www.youtube.com/@EOTCDebregenetEdmonton/about`, `https://www.youtube.com/@Bietelhiem/about`, `https://www.youtube.com/@zion-tube8419/about`, `https://www.youtube.com/@mezmurcatholic/about`, `https://www.youtube.com/@eritreancatholiccharismati7818/about`, `https://www.youtube.com/@catholicmezmur5540/about`, `https://www.youtube.com/@jesusmaranatha/about`, `https://www.youtube.com/@philadelphiaevangelicaleri8291/about`, `https://www.youtube.com/@GospeLlightEritreanChurch/about`, `https://www.youtube.com/@EritreanChurchDC/about`, `https://www.youtube.com/@wengelawit/about`

---

## 2. Music per decade (nostalgia programming)

### Summary
The *unqualified* term **"Eritrean music" has the strongest, most Eritrea-concentrated Trends signal of any term tested in this research** — but it is trending **down** over the 5-year window, and nobody actually searches Google with a decade qualifier attached ("Eritrean music 80s" etc. are each >95% zero-volume weeks). On YouTube, decade-nostalgia content clearly has an audience (individual old-song videos pulling 300K–2.2M views) but **no single channel or brand owns the category** — it's spread across a dozen small/inconsistent reupload channels. Generic "Tigrinya music" search (with or without script) is heavily Ethiopia/Tigray-contaminated and should not be read as Eritrean-diaspora demand.

### Google Trends

**Job: 4-way compare — `Tigrinya music 90s`, `Eritrean music 80s`, `Eritrean music 70s`, `Eritrean music 2000s`** (comparable to each other only):

| Term | 5y avg | Max (date) | % weeks at 0 |
|---|---|---|---|
| Eritrean music 80s | 0.9 | 92 (Aug 16–22, 2026) | 98.9% |
| Tigrinya music 90s | 0.2 | 65 (Jul 2–8, 2023) | 99.6% |
| Eritrean music 2000s | 0.4 | 100 (Oct 31–Nov 6, 2021) | 99.6% |
| Eritrean music 70s | 0.0 | 0 | 100% (no measurable volume) |

**None of the decade-qualified phrases have meaningful standalone Trends volume** — these are below Google's reliable measurement threshold; essentially nobody searches Google text search this way (they may search directly on YouTube — see below).

**Standalone `Eritrean music`** (no decade, no "Tigrinya"): avg index **51.7**, max 100 (week of Dec 26, 2021–Jan 1, 2022), **declining** over the window (1st-half avg 57.3 → 2nd-half avg 46.1, ≈ **-20%**). Geo: Eritrea = 100, Ethiopia = 8, Sudan = 2, all other diaspora hubs (US, DE, SE, IL, GB, CA, NL, IT) = 0 in this widget — i.e. this is a clean, Eritrea-concentrated signal, the strongest of any term tested, but the raw search volume itself looks concentrated inside Eritrea rather than spread across the diaspora hubs.

**Standalone `Tigrinya music`**: avg 3.0, geo = **Ethiopia 100, every other country (incl. Eritrea) = 0**. **This generic phrase is an Ethiopia/Tigray signal, not an Eritrean-diaspora one** — same pattern as the Tigrinya-script religion terms above.

**Standalone `ሙዚቃ ትግርኛ`** (Tigrinya-script "Tigrinya music"): avg 10.2, rising within-window (6.8 → 13.6), but geo again **Ethiopia = 100, Sudan = 3, Eritrea = 0**. Related-queries widget for this term came back empty (no data).

No related-queries data available for any music term tested.

### YouTube

Search for `Eritrean music 80s` / `Eritrean music 90s` surfaces a long tail of small/mid reupload and archive channels rather than one dominant brand:

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Aida Kidane | 64.6K | 591 | dedicated archival channel of old Eritrean songs |
| Massawatube | 64.7K | 366 | "Merhawi (Wedi Haleka) Shawley" video at **2,245,978 views** (9y old) |
| DJ Teddy | 27.1K | 142 | "Eritrean Old School Mix Music 2021" at 1,184,276 views |
| Lyric Tigrigna Songs | 33.7K | 28 | lyric-video format, one song at 905,378 views |
| Star Zema | 10.6K | 52 | "Best Tigrinya Music Collection" compilation, 428,443 views (posted 6mo ago — relatively fresh) |
| Rasfigo | 1.5K | 17 | single Bereket Araya old-song upload, 301,642 views |
| KEBHENA MEDIA ከብሕና ሜድያ | 1.06K | 17 | 225,551 views on one old-song upload |
| Mangato melody, Masterpiece Tigrigna Songs, cyberamd, 7up Tube, Filmon primo | each <2K subs seen in results | — | one-off old-song reuploads, several with 400K–1.8M views on individual videos despite tiny subscriber bases |

No channel in this search exceeded ~65K subscribers, versus 100K+ for multiple Orthodox channels and 726K for Eri-TV in News — **the decade-nostalgia niche is clearly watched (views regularly in the hundreds of thousands to low millions per video) but nobody has consolidated it into one well-subscribed, consistently-uploading channel.**

By contrast, searching generic `ሙዚቃ ትግርኛ` (Tigrinya music) surfaces almost entirely **contemporary Ethiopian-Tigray productions** from the label "Nahom Records Inc and Nahom Multimedia," explicitly titled "New *Ethiopian* Tigrigna Music" with enormous scale (one track at **40,174,582 views**, another at 19,758,222, another at 15,717,318) — this is out of scope per the brief and is flagged here only to note that undifferentiated "Tigrinya music" search/YouTube traffic is dominated by Ethiopia, not Eritrea.

### Sources (Music)
- Trends API (4-way decade compare), accessed 2026-11-01: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Tigrinya%20music%2090s,Eritrean%20music%2080s,Eritrean%20music%2070s,Eritrean%20music%202000s&hl=en-US`
- Trends API (standalone `Eritrean music`, `Tigrinya music`, `ሙዚቃ ትግርኛ`), accessed 2026-11-01: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20music`, `...q=Tigrinya%20music`, `...q=%E1%88%99%E1%8B%B5%E1%89%83%20%E1%89%B5%E1%8C%8D%E1%88%AD%E1%8A%9B`
- YouTube search, accessed 2026-11-01: `https://www.youtube.com/results?search_query=Eritrean+music+80s`, `https://www.youtube.com/results?search_query=Eritrean+music+90s`, `https://www.youtube.com/results?search_query=%E1%88%99%E1%8B%B5%E1%89%83%20%E1%89%B5%E1%8C%8D%E1%88%AD%E1%8A%9B`
- YouTube channel About pages, accessed 2026-11-01: `https://www.youtube.com/@Aidakidane/about`, `https://www.youtube.com/@Massawatube/about`, `https://www.youtube.com/@DJayTeddy/about`, `https://www.youtube.com/@LyricTigrignaSongs/about`, `https://www.youtube.com/@StarZema1/about`, `https://www.youtube.com/@Rasfigo1/about`, `https://www.youtube.com/@kebhenamedia1787/about`, `https://www.youtube.com/@LihamMelody/about`

---

## 3. Podcasters

### Summary
**This is the weakest Google Trends signal of any of the four verticals, by a wide margin** — every phrasing tested ("Eritrean podcast", "Tigrinya podcast", "ፖድካስት") is at or near zero search volume over 5 years. YouTube supply is real but fragmented: one clear breakout channel (Kezahta, 161K subs) plus a handful of small, inconsistently-active shows.

### Google Trends

**Job: 3-way compare — `Eritrean podcast`, `Tigrinya podcast`, `ፖድካስት`** (comparable to each other):

| Term | 5y avg | Max (date) | % weeks at 0 |
|---|---|---|---|
| Eritrean podcast | 0.7 | 100 (Jul 23–29, 2023) | 99.2% |
| Tigrinya podcast | 0.0 | 0 | 100% (no data) |
| ፖድካስት | 0.0 | 0 | 100% (no data) |

Standalone `Eritrean podcast` confirms the same: avg 0.7, 99.2% zero weeks, one isolated spike in July 2023 and nothing sustained before or since. In the direct 4-way cross-category comparison against Orthodox/Music/News (below), `Eritrean podcast` is essentially flat at the bottom of the chart the entire 5 years.

Geo breakdown for `Eritrean podcast`: only the US shows any signal (66 vs. `Tigrinya podcast` 34, everywhere else incl. Eritrea = 0) — whatever thin signal exists is diaspora-side (US), not inside Eritrea, which is the opposite pattern from Orthodox/Music/News (all Eritrea-concentrated). No related-queries data available (empty result).

### YouTube

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| ቀዛሕታ Kezahta | 161K | 664 | clear category breakout; one episode ("ፃንሒት ምስ ኣዶናይ ብርሃነ") at 236,523 views |
| Dok'a Podcast | ዶቃ ፖድካስት | 29.2K | 192 | regular interview-format episodes |
| Meazn Podcast | 7.54K | — | appeared as a dedicated channel card in search |
| BreakingBarriersnl (BBBB De Podcast) | 7.1K | 312 | Tigrinya-edition episodes, most recent 2 weeks old at access time |
| Samsom Mulue | 5.13K | 37 | numbered "Tigrigna Podcast #1/#2/..." series, 3K–21K views/episode |
| Laza Media Service | 92.4K | ~1,900 | broader media/podcast-adjacent output, not pure podcast |
| DC PODCAST - ዲሲ ፖድካስት | 537 | **only 11 videos** | low and inconsistent output |
| Kenganda | 196K | ~1,700 | English-language Eritrea/Horn-of-Africa commentary/interview show — large reach but not Tigrinya-language, so only partially in-scope |

Upload cadence is uneven across the field: Kezahta and Dok'a Podcast look like the most consistently active mid-size shows; DC Podcast and several others look close to dormant (single-digit-to-low-double-digit total video counts). No channel in this category approaches Eri-TV's scale (News) or the top Orthodox channels' scale, but Kezahta (161K) is comparable to the mid-tier News/Orthodox channels.

### Sources (Podcasters)
- Trends API (3-way podcast compare), accessed 2026-11-01: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20podcast,Tigrinya%20podcast,%E1%8D%96%E1%8B%B6%E1%8A%AB%E1%88%B5%E1%89%B5&hl=en-US` (standalone form: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20podcast`)
- YouTube search, accessed 2026-11-01: `https://www.youtube.com/results?search_query=Eritrean+podcast`, `https://www.youtube.com/results?search_query=%E1%8D%96%E1%8B%B6%E1%8A%AB%E1%88%B5%E1%89%B5%20%E1%89%B5%E1%8C%8D%E1%88%AD%E1%8A%9B` (ፖድካስት ትግርኛ)
- YouTube channel About pages, accessed 2026-11-01: `https://www.youtube.com/@kezahta/about`, `https://www.youtube.com/@Doka.Podcast/about`, `https://www.youtube.com/@breakingbarriersNL/about`, `https://www.youtube.com/@SamsomMulue/about`, `https://www.youtube.com/@LazaMediaService/about`, `https://www.youtube.com/@dcpodcast1/about`, `https://www.youtube.com/@Kenganda/about`

---

## 4. News

### Summary
**News shows the only clearly *rising* Trends signal of the four verticals** ("Eritrea news" roughly doubled from the first half to the second half of the 5-year window) and the cleanest, broadest diaspora-hub geo spread of anything tested. It is also, by a wide margin, **the most saturated category on YouTube** — Eri-TV alone (726K subscribers, daily uploads) outsizes every single channel found across all four verticals combined.

### Google Trends

**Job: 3-way compare — `Eritrea news`, `Tigrinya news`, `ዜና ኤርትራ`** (comparable to each other):

| Term | 5y avg | Max (date) | % weeks at 0 | Trend (1st half → 2nd half) |
|---|---|---|---|---|
| Eritrea news | 19.0 | 100 (Oct 5–11, 2025) | 0.4% | 12.5 → 25.6 (**+105%, clearly rising**) |
| Tigrinya news | 8.0 | 18 (Dec 19–25, 2021) | 5.7% | 9.9 → 6.0 (-39%, declining) |
| ዜና ኤርትራ | 0.0 | 4 (Oct 23–29, 2022) | 98.5% | ~0 → ~0 (no measurable signal) |

Standalone confirms: `Eritrea news` avg 19.0 (identical, same +105% rise); `Tigrinya news` avg **44.9** standalone (much higher baseline than in the 3-way compare, because it's being normalized against itself rather than against the larger `Eritrea news` term), still declining 56.1 → 33.7 (**-40%**), peak back in Dec 2021.

**Geo breakdown is the broadest and cleanest of anything tested in this research** (3-way compare job, values are `[Eritrea news, Tigrinya news, ዜና ኤርትራ]`):

| Country | Values |
|---|---|
| Eritrea | [26, 72, 2] |
| United States | [81, 19, 0] |
| Canada | [77, 23, 0] |
| United Kingdom | [72, 28, 0] |
| Israel | [72, 28, 0] |
| Italy | [68, 32, 0] |
| Germany | [65, 35, 0] |
| Netherlands | [64, 36, 0] |
| Sudan | [44, 56, 0] |
| Sweden | [56, 44, 0] |
| Ethiopia | [45, 46, 9] |

Every single named diaspora hub shows real (nonzero) volume for both English-language news terms — this is the only vertical in this research where that is true across the board. `ዜና ኤርትራ` (Ge'ez script) is negligible everywhere, confirming (again) that this audience searches Google in English for this topic, not in Tigrinya/Ge'ez script.

No related-queries data available for any news term tested (empty result for `Eritrea news` and `Tigrinya news` standalone runs).

### Cross-category comparison (all 4 verticals, one shared normalization)

**Job: `Eritrean Orthodox`, `Eritrean music`, `Eritrean podcast`, `Eritrea news`** — the only query in this research that puts all four candidate verticals on the same 0–100 scale at once:

| Term | 5y avg | Max (date) | Trend (1st half → 2nd half) |
|---|---|---|---|
| Eritrea news | 19.0 | 100 (Oct 5–11, 2025) | 12.5 → 25.6 (**+105%, rising**) |
| Eritrean music | 18.5 | 36 (Dec 26, 2021–Jan 1, 2022) | 20.6 → 16.5 (-20%, declining) |
| Eritrean Orthodox | 10.2 | 29 (Apr 5–11, 2026) | 9.3 → 11.0 (+18%, rising) |
| Eritrean podcast | 0.0 | 4 | flat at ~0 the entire window |

**This is the single most important, directly-comparable number in this report:** on a shared scale, News and Music currently have comparable (News roughly tied/ahead), Orthodox is roughly half their level, and Podcast is statistically indistinguishable from zero. News is the only one of the four still rising.

### YouTube

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Eri-TV, Eritrea (Official) | **726K** | **~21,000** | daily Tigrinya midday + evening news, 10K–24K views per video, newest video 8 hours old at access time |
| Hidmona TV | 237K | 314 | independent/diaspora-leaning Eritrea-focused channel |
| ላዛ ሚድያ ሰርቪስ Laza Media Service | 92.4K | ~1,900 | broader Eritrean diaspora media |
| Hbri Broadcast | 80.8K | 354 | — |
| BBC News ትግርኛ (official BBC Tigrinya service) | 55.8K | ~1,200 | institutional-grade benchmark of outside interest in Tigrinya-language news |
| ትግርኛ ዜና tigrigna news | 40.9K | 971 | breaking-news clip format |

Searching `Eritrea news Tigrinya` returns almost exclusively Eri-TV's own near-daily uploads. Searching `ዜና ኤርትራ` (Ge'ez script) instead surfaces mostly **Amharic-language Ethiopian commentary/opposition channels about the Eritrea–Ethiopia–Tigray conflict** (e.g. "Abel Birhanu," "Microphone Media," "phanos news," "Hibret Media Network") rather than Tigrinya-language, Eritrea-run content — this is explicitly out of scope per the brief and is flagged here as noise in that particular query, not counted toward Eritrean-diaspora supply.

**News is unambiguously the most saturated of the four verticals**: Eri-TV's subscriber count (726K) alone is roughly 4x the largest channel found in any other vertical (Liham Melody/music at 862K is actually larger, see caveat below, but that channel's Eritrean-vs-Ethiopian content mix is ambiguous — see Music section) and several times the largest unambiguously-Eritrean channel elsewhere (130K-ish range for top Orthodox channels, 161K for the top podcast channel).

### Sources (News)
- Trends API (3-way news compare), accessed 2026-11-01: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrea%20news,Tigrinya%20news,%E1%8B%9C%E1%8A%93%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB&hl=en-US`
- Trends API (standalone `Eritrea news`, `Tigrinya news`), accessed 2026-11-01: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrea%20news`, `...q=Tigrinya%20news`
- Trends API (4-way cross-category compare: Orthodox/Music/Podcast/News), accessed 2026-11-01: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox,Eritrean%20music,Eritrean%20podcast,Eritrea%20news&hl=en-US`
- YouTube search, accessed 2026-11-01: `https://www.youtube.com/results?search_query=Eritrea+news+Tigrinya`, `https://www.youtube.com/results?search_query=%E1%8B%9C%E1%8A%93%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB` (ዜና ኤርትራ)
- YouTube channel About pages, accessed 2026-11-01: `https://www.youtube.com/@EriTVEritreaOfficial/about`, `https://www.youtube.com/@HidmonaTelevision/about`, `https://www.youtube.com/@LazaMediaService/about`, `https://www.youtube.com/@Hbri-broadcast/about`, `https://www.youtube.com/@BBCNewsTigrinya/about`, `https://www.youtube.com/@tigrignazena/about`

---

## 5. Sports (Eritrean athletes, national team(s), Olympics)

**Scope note:** per the owner's brief, this section is scoped to Eritrean athletes, the Eritrean national team(s) (the owner's strongest-known sub-case is cycling — the national cycling team, individual pro riders, Tour de France/Giro/World Championship participation — plus distance running and Olympic participation generally), not the broader Horn of Africa and not generic pan-African sport.

### Summary
Of every term tested in this entire research project, Sports has the **most name-concentrated signal of all**: the generic category terms ("Eritrean cycling," "Eritrean athletics," "Eritrean national team") are statistically indistinguishable from zero on Google Trends — the same near-total-flatline pattern seen in Podcasters — but one specific athlete's name, **Biniam Girmay** (Eritrea's Tour de France stage- and green-jersey-winning cyclist), carries real, Eritrea-concentrated, currently-rising search volume on his own. YouTube supply mirrors this: there is no consolidated, well-subscribed "Eritrean Sports" brand channel (the two channels literally named that way have 30 and 8 subscribers respectively), but a small dedicated archival channel (Haki Fitewu, 25.3K subs) and Eritrea's existing broader-media channels (Cinema Semere Media, Eri-TV's own channels) already cover marquee results as they happen, and marquee moments themselves (Girmay's Tour de France stage win, Eritrea's first Winter Olympian) have pulled hundreds of thousands to low millions of views — but on international outlets NahomEriTV does not control, not on any Eritrean-run channel.

### Google Trends

**Job: 5-way compare — `Eritrean cycling`, `Eritrean athletics`, `Eritrean national team`, `Eritrea Olympics`, `Biniam Girmay`** (these 5 numbers are directly comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Biniam Girmay | 3.6 | 100 (Jun 30 – Jul 6, 2024) | 16.0% | 2.7 → 4.5 (+67%, rising) |
| Eritrea Olympics | 0.2 | 10 (Jul 21–27, 2024) | 94.3% | 0.1 → 0.3 (thin, off a near-zero base) |
| Eritrean national team | 0.0 | 1 (Jun 9–15, 2024) | 98.1% | ~0 → ~0 (no measurable signal) |
| Eritrean cycling | 0.0 | 1 (Mar 27 – Apr 2, 2022) | 99.2% | ~0 → ~0 (no measurable signal) |
| Eritrean athletics | 0.0 | 0 | 100% | **zero search volume for the full 5 years** |

The peak dates line up with real events: Biniam Girmay's index-100 week (late June 2024) is the opening of the 2024 Tour de France, where he won stage 3 and later the green (points) jersey; `Eritrea Olympics`' peak (late July 2024) is the Paris Olympics opening. This is the only vertical in this research where the Trends spikes visibly track a specific, dateable sporting calendar (Tour de France start, Olympics opening) rather than a diffuse or random pattern.

Standalone (single-term) re-runs: `Biniam Girmay` alone is identical to the 5-way figure (avg 3.6, same max/trend) — he is dominant enough that adding the other four terms to the comparison doesn't rescale his curve. `Eritrea Olympics` alone averages **1.7** (vs. 0.2 in the 5-way job — same normalization effect documented elsewhere in this report, e.g. `Tigrinya news` 44.9 standalone vs. 8.0 in its 3-way job), max 100 (Jul 21–27, 2024), 92.7% zero weeks. `Eritrean cycling` alone averages 2.1, max 100 (Mar 27 – Apr 2, 2022 — unclear underlying event), 96.9% zero weeks, **declining** (3.0 → 1.2). `Eritrean athletics` alone averages 0.4, max 100 (week of Jan 18, 2026), 99.6% zero weeks.

A sixth term, **`Zersenay Tadese`** (Eritrea's half-marathon world-record holder) was also tested standalone for context: avg 1.4, max 100 (week of Jun 14, 2026), 97.7% zero weeks — thin and not clearly tied to a specific recent event.

**Geo breakdown (5-way compare job, values are `[cycling, athletics, national team, Olympics, Girmay]`):**

| Country | Values |
|---|---|
| United States | [2, 0, 3, 15, 80] |
| Canada | [3, 0, 3, 12, 82] |
| United Kingdom | [3, 0, 2, 8, 87] |
| Sweden | [2, 0, 0, 3, 95] |
| Germany | [1, 0, 0, 1, 98] |
| Netherlands | [1, 0, 0, 1, 98] |
| Ethiopia | [4, 0, 0, 4, 92] |
| Israel | [0, 0, 0, 0, 100] |
| Eritrea | [0, 0, 0, 0, 0] |
| Italy | [0, 0, 0, 0, 0] |
| Sudan | [0, 0, 0, 0, 0] |

In this shared-scale breakdown, `Biniam Girmay` dominates every diaspora hub that has any signal at all (80–98 in the US/CA/GB/SE/DE/NL, 92 in Ethiopia) — **Eritrea itself shows 0 across all five terms here**, which looks counterintuitive until the standalone run below is read: it is a normalization artifact (Eritrea's smaller absolute search volume for these English terms gets swamped once Girmay's globally-driven volume sets the 0–100 scale), not evidence of zero interest inside Eritrea.

**Standalone geo for `Biniam Girmay`:** Eritrea = 100, every other country including Ethiopia, the US, and the rest of the named diaspora hubs = 0. This is a **clean, Eritrea-specific signal** on par with the standalone `Eritrean Orthodox` (ER=45, everywhere else near-0) and `Eritrean music` (ER=100) results elsewhere in this report — confirming that, read on its own rather than against his own international fame, search interest in Girmay by name is genuinely concentrated in Eritrea.

**Standalone geo for `Eritrea Olympics`:** Ethiopia = 100, every named diaspora hub = 0, Eritrea itself returned no data (below threshold) — this phrase is **Ethiopia-contaminated**, the same pattern documented for `EOTC`, `Tigrinya music`, and generic `Tigrinya news` elsewhere in this report.

**Standalone geo for `Eritrean cycling`, `Eritrean athletics`, `Eritrean national team`:** each returns a single noisy tiny-country spike at index 100 (Barbados, Brunei, and Trinidad & Tobago respectively) with every named diaspora hub and Eritrea itself at 0 or no-data — the same low-confidence noise pattern flagged in the Methodology section (c.f. Tuvalu/Cape Verde). `Eritrean cycling` also shows a non-noise Ethiopia value of 18. These three generic-category terms are too thin to read a real geo pattern from at all.

**Standalone geo for `Zersenay Tadese`:** Ethiopia = 100, every named hub = 0, Eritrea = no data — Ethiopia-contaminated despite naming a specific Eritrean (not Ethiopian) athlete, the same pattern as `Eritrea Olympics`.

**Tigrinya/Ge'ez-script check:** two script phrasings were tested standalone — `ብሽክለታ ኤርትራ` ("cycling Eritrea") and `ስፖርት ኤርትራ` ("sport Eritrea"). Both average 0.4 with 99.6% zero-volume weeks, and — unlike the Ge'ez-script terms in the other four verticals, which at least returned a usable (if Ethiopia-dominated) geo breakdown — **both returned no geo data at all for any country, Eritrea included: the volume is too thin even to tell where it's coming from.** Net finding for Sports: this vertical doesn't cleanly replicate the "script query = Ethiopia signal" pattern found elsewhere, because script-based sports search barely exists at measurable volume in the first place; the one Ethiopia-contaminated result here (`Zersenay Tadese`) came from an English-script athlete name, not a Ge'ez-script query.

No related-queries data available for any of the 7 terms tested (empty `rankedKeyword` list for every one) — consistent with every other term in this research.

### YouTube

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Cinema Semere Media | 189K | 5,264 | **not sports-exclusive** (broad Eritrean entertainment/culture/news channel) but has become a frequent source of cycling-specific coverage recently: "African championship 2026 in Kusumu Kenya" livestream 55,553 views (6d ago), "ሃገራዊት ጋንታ ተመሪጻ... Eritrea Cycling 2026" 21,331 views (1mo ago) |
| Eritrean News by Eri-TV Live Television | 97.9K | 2,963 | distinct secondary Eri-TV-branded channel (separate from the main Eri-TV channel profiled in §4 News, 726K subs); carries archival sports reportage, e.g. "National Cycle Championship 2015" reportage (18,549 views, 11y old) |
| Haki Fitewu | 25.3K | 155 | the closest thing to a **dedicated Eritrean cycling/athletics specialist channel** found; 9,038,807 lifetime views across only 155 videos (~58K views/video average); still active on current events — "Eritrean Tsegay Weldlibanos Wins Honolulu Marathon 2025" (13,317 views, 10mo ago), "Dawit Seare WINS Mens 5km — World Road Running Championships 2026" (15,699 views, 1mo ago) |
| ERI CAMEL | 3.81K | 186 | joined Dec 2024 — new, small, fan/community cycling-and-culture channel |
| Eri Love | 3.24K | 94 | general Eritrean-culture channel; one sports clip ("ኣትሌት ዳዊት ሳዓረ" / athlete Dawit Seare) at 26,069 views |
| Eritrea Cycling | 2.47K | 364 | small but dedicated cycling channel, 3,291,805 lifetime views |
| ERIVISION | 2.12K | 190 | general-interest channel; posts occasional sports/fitness content |
| Eritrean Cycling (distinct, smaller channel of the same name) | 228 | 33 | near-dormant |
| Eritrean Sports (@eritreansports7859) | 30 | 2 | essentially a placeholder — no real content |
| Las Vegas Eritrean Sports | 8 | 5 | single diaspora community sports-day channel, essentially dormant — same single-event, single-community pattern as the smallest Protestant/Evangelical church channels in §1 |

Eri-TV's main channel (726K subscribers, ~21,000 videos, daily uploads — see §4 News) also already treats the national cycling championship as recurring programming in its own right: "ውድድር ብሽክለታ ቻምፕዮን ኤርትራ 2025" (Eritrean Road Cycling Championship 2025, live) at 176,169 views and the 2026 edition at 15,108 views. **This means the single largest Eritrean media channel is not ignoring cycling — it is already the de facto incumbent broadcaster for the sport's biggest annual domestic event**, the same saturation dynamic found for News generally in §4.

**International/non-Eritrea-specific context** (flagged, not counted toward Eritrean-diaspora supply, same treatment as the BBC Tigrinya and Olympic Games official-channel references elsewhere in this report): major international sports-media outlets have covered individual Eritrean-athlete milestones at far larger scale than any Eritrean channel — TNT Sports/Eurosport's clip of Girmay's first Grand Tour stage win (2,060,007 views), FloBikes' "Biniam Girmay Wins Gent-Wevelgem" (911,187 views), the Olympic Games official channel's "How Eritrean Cycling Made It to the Top of the Giro d'Italia" (112,430 views), and BBC/VOA/Reuters human-interest pieces on Shannon Abeda, Eritrea's first Winter Olympian. These confirm that marquee Eritrean-athlete moments can draw audiences in the hundreds of thousands to millions — but that audience is currently captured entirely by outlets NahomEriTV does not control.

### Addendum (2026-11-02 follow-up): diaspora-heritage players who represent other countries — Alexander Isak and Lily Yohannes

**Identity confirmation (done before running any query below):**
- **"Isak" = Alexander Isak**, Swedish international striker (born Stockholm/Solna, Sep 1999), currently at Liverpool FC after a British-record £125m transfer-deadline-day move from Newcastle United on Sep 1–2, 2025. His father, **Teame Isak**, is Eritrean-born (Tigrinya ethnic group) and fled Eritrea for Sweden with Isak's mother in the late 1980s; Isak has spoken publicly about his Eritrean roots (e.g. BBC Sport's "Strikers United: Alan Shearer meets Alexander Isak") and visited Eritrea in 2018. No other "Isak" turned up in an Eritrean-sports context during this research — the identification is high-confidence. Note for the research record: the task brief's assumption that he is "currently Newcastle United" is now stale — he moved to Liverpool at the start of the 2025–26 season.
- **"Lily" = Lily Yohannes**, American soccer player (born Springfield, Virginia, Jun 2007) to two Eritrean parents, **Daniel and Semhar Yohannes**. She moved to Amsterdam with her family at age 10, came up through Ajax, was eligible for the US, the Netherlands, *and* Eritrea, and committed to the US women's national team in November 2024 (senior USWNT debut earlier in 2024); she now plays club football for Olympique Lyonnais (joined Jul 2025). No other "Lily" turned up in an Eritrean-sports context — the identification is high-confidence.

**Scope flag — read before the numbers below:** both athletes are diaspora-heritage players who represent **other countries' national teams**, not Eritrea's — Isak plays for Sweden, Yohannes for the United States (after also training within the Dutch federation's system via Ajax). This is a materially different case from Biniam Girmay and Zersenay Tadese above, both of whom compete for Eritrea's own national federation directly. The distinction is sharpened by one more fact surfaced in this research: Lily Yohannes's own older brother, **Aethan Yohannes**, plays for Almere City FC's youth setup *and for Eritrea's senior national team* — i.e., within one immediate family, one sibling plays for Eritrea and one plays for the USA. This is about as concrete an illustration as this research turned up of the real scope question the owner needs to resolve, not something this research resolves on its own: does a NahomEriTV "Eritrean players"/"Eritrean sports" channel include diaspora/heritage stars who play for other countries (a much larger, more search-visible pool — see Isak's numbers below, which dwarf Girmay's), or only athletes who actually compete for Eritrea (a smaller but unambiguous pool, Girmay/Tadese/Aethan Yohannes)?

**Google Trends**

**Job: 4-way compare — `Alexander Isak`, `Lily Yohannes`, `Biniam Girmay`, `Zersenay Tadese`** (these 4 numbers are directly comparable to each other; Girmay's and Tadese's numbers here are lower than their own figures in the 5-way sports job above purely because of the normalization effect documented in Methodology — adding Isak, who carries far more absolute global search volume, rescales the shared 0–100 axis. Their canonical standalone figures, 3.6 and 1.4 respectively, are unchanged and reported above):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Alexander Isak | 6.1 | 100 (Aug 31 – Sep 6, 2025) | 0.4% | 2.7 → 9.4 (+246%, clearly rising) |
| Biniam Girmay | 0.5 | 16 (Jun 30 – Jul 6, 2024) | 83.6% | 0.3 → 0.6 (+94%, rising — rescaled down here, see note above) |
| Lily Yohannes | 0.1 | 6 (Jun 2–8, 2024) | 96.9% | 0.0 → 0.1 (thin, rising off a near-zero base) |
| Zersenay Tadese | 0.0 | 0 | 100% | ~0 → ~0 (no measurable signal, consistent with §5 above) |

The peak dates line up with real, dateable events, the same pattern already noted for Girmay/Olympics above: Isak's index-100 week (Aug 31–Sep 6, 2025) is the week Newcastle and Liverpool agreed his £125m transfer and he completed the move on deadline day (Sep 1–2, 2025); Yohannes's peak week (Jun 2–8, 2024) lines up with her scoring for the senior USWNT against South Korea on June 4, 2024 (per the "Lily Yohannes GOAL | USWNT vs. Korea Republic | June 4, 2024" U.S. Soccer video found in the YouTube search below).

Standalone (single-term) re-runs: `Alexander Isak` alone is identical to the 4-way figure (avg 6.1, same max/trend) — he is dominant enough that adding the other three terms doesn't rescale his curve, the same pattern already seen for `Biniam Girmay` in the original 5-way job above. `Lily Yohannes` alone averages **1.7** (vs. 0.1 in the 4-way job — the same normalization effect documented throughout this report), max 100 (Jun 2–8, 2024), 64.1% zero weeks, trend 0.5 → 2.9 (**+515%, rising, but off a thin base**).

A further 2-way job tested the Eritrea-qualified variants directly — **`Alexander Isak Eritrea`, `Lily Yohannes Eritrea`** (comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Alexander Isak Eritrea | 2.1 | 100 (Jun 14–20, 2026) | 94.7% | 1.0 → 3.1 (+196%, rising) |
| Lily Yohannes Eritrea | 0.2 | 53 (Jun 2–8, 2024) | 99.6% | 0.0 → 0.4 (thin, rising off a zero base) |

**Geo breakdown (4-way compare job, values are `[Alexander Isak, Lily Yohannes, Biniam Girmay, Zersenay Tadese]`):**

| Country | Values |
|---|---|
| United States | [80, 8, 12, 0] |
| Canada | [79, 1, 20, 0] |
| United Kingdom | [96, 0, 4, 0] |
| Sweden | [97, 0, 3, 0] |
| Germany | [65, 1, 34, 0] |
| Netherlands | [56, 12, 32, 0] |
| Ethiopia | [80, 7, 13, 0] |
| Israel | [61, 0, 39, 0] |
| Eritrea | [0, 0, 0, 0] |
| Italy | [69, 0, 31, 0] |
| Sudan | [0, 0, 0, 0] |

As with `Biniam Girmay` in the original 5-way job above, Eritrea shows 0 across the board here — the same normalization artifact (Isak's globally-driven volume swamps everyone else's smaller absolute volume once the shared 0–100 scale is set), not evidence of zero domestic interest; the standalone checks below are the more informative read.

**Standalone geo for `Alexander Isak`:** Uganda = 100, Sweden = 84, Zimbabwe = 64, Ethiopia = 60, Malawi = 53 (Uganda/Zimbabwe/Malawi are the same low-confidence tiny/mid-country noise pattern flagged in Methodology — broad pan-African football-fan interest in a global star, not a reliable geo signal); named diaspora hubs: United Kingdom = 18, Netherlands = 4, Canada = 3, United States = 2, Germany = 2, Italy = 1, Israel = 1, Sudan = 0, **Eritrea = 0**. Unlike `Biniam Girmay` (ER=100 standalone, a clean Eritrea-concentrated signal) or `Fenkil` (ER=100) elsewhere in this report, Isak's own-name search volume is **not** detectably concentrated in Eritrea at all — it reads as Sweden-plus-global-football-fandom, consistent with him playing for Sweden rather than Eritrea.

**Standalone geo for `Lily Yohannes`:** Ethiopia = 100, Bahamas = 32 and Malta = 25 (same low-confidence noise pattern), Netherlands = 14, Côte d'Ivoire = 7, United States = 3, every other named diaspora hub and **Eritrea = 0**. As with `Zersenay Tadese` and `Eritrea Olympics` elsewhere in this report, this is an **Ethiopia-contaminated** result for a search term naming a specific Eritrean-heritage athlete, not a clean Eritrea signal.

**Standalone geo for the Eritrea-qualified variants:** `Alexander Isak Eritrea` returns only two noisy spikes (Sweden = 100, Uganda = 100) with every other country, Eritrea included, below 1% or no-data; `Lily Yohannes Eritrea` returns only Netherlands and United States at <1% with everywhere else returning no data at all. Both terms are too thin even to read a geo pattern from — the same "too thin even to tell where it's coming from" pattern already documented for the Ge'ez-script Sports and Holidays terms elsewhere in this report. Qualifying either athlete's name with "Eritrea" does not surface a cleaner signal; if anything the already-thin volume shrinks further.

No related-queries data available for any of the 6 terms tested in this addendum (`Alexander Isak`, `Lily Yohannes`, `Biniam Girmay`, `Zersenay Tadese` in the 4-way job, plus the two Eritrea-qualified variants) — empty `rankedKeyword` list for every one, consistent with every other term in this research.

### YouTube (addendum)

Per the brief, this search specifically targets **Eritrean-run or diaspora-run** content about these two players, distinct from the (very large) volume of generic international football media about them, which is noted separately below for scale and not counted as Eritrean-diaspora supply.

| Channel | Subscribers | Notable |
|---|---|---|
| Eri link - ኤሪ ሊንክ | 105K (22.6M lifetime views; joined Oct 2022) — already appears elsewhere in this report (§6 Fenkil) as a general Eritrea-news/culture channel | dedicated video "Alexander Isak ኣሌክሳንደር ኢሳቕ" hashtagged `#eritrea #sports #asmara #eritrean #eritreanews #eritreanmovie #eritv`, 40,970 views (1y ago) — the clearest Eritrean-run content found naming Isak specifically |
| Cinema Semere Media | 189K (see §5 above) | "lily yohannes biography Eritrean Sport News Update with Cinema Semere ሊሊ ዮውሃንስ መን'ያ ኤርትራዊት አሜሪካዊት" at 2,786 views (1y ago) — the same broad Eritrean culture/news/sports channel already covering cycling above, also covering Yohannes |
| The Yohannes Trio Football Channel (@MrDanyoh) | 803 subscribers (208,118 lifetime views; channel created 2010, repurposed) | run by Lily Yohannes's own father, **Daniel Yohannes** (confirmed via the Defector interview cited in Sources below), documenting Lily's and her brothers' soccer careers — including Aethan, who plays for Eritrea's national team (see scope flag above); multiple videos posted within weeks of access (newest ~2 weeks old), individual views in the hundreds to low thousands |

No other Eritrean-run or diaspora-run channel surfaced a dedicated video about either athlete across either search — Eri link's Isak video and Cinema Semere's Yohannes video are, between them, the only clearly Eritrean-produced content found naming either player specifically, and the Yohannes Trio channel is a family channel rather than a media brand (the same single-family/single-community pattern as the smallest channels in §1 and §6).

**International/non-Eritrea-specific context** (flagged, not counted toward Eritrean-diaspora supply, same treatment as above): BBC Sport's "Strikers United: Alan Shearer meets Alexander Isak" (The Big Interview), which discusses his Eritrean roots directly, has 587,902 views; LALIGA EA SPORTS's "Alexander Isak: The Swedish Eritrean Footballer" has 6,665 views; Newcastle's own local paper's channel, Chronicle Live, posted "We Tried Alexander Isak's Favourite Eritrean Restaurant in Newcastle" (1,124 views) — a mainstream human-interest crossover referencing his heritage, not Eritrean-run. The generic (no-qualifier) `Alexander Isak` search surfaces an enormous, currently-live volume of Premier League highlight/controversy coverage (individual clips posted hours before access already at 5,000–235,000+ views) — his name alone carries huge search and view volume, just not on any Eritrean-run channel. For Yohannes, Dutch public broadcaster youth-news show NOS Jeugdjournaal covered her choice between the US and Netherlands at 74,506 views, and official/league channels (U.S. Soccer, USWNTCuts, UEFA, CBS Sports W Golazo, ESPN UK) post her national-team and club highlights with views from the low thousands up to 59,337 — again mainstream/official, not Eritrean-run.

### Sources (Sports)
- Trends API (sports 5-way compare), accessed 2026-11-02: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20cycling,Eritrean%20athletics,Eritrean%20national%20team,Eritrea%20Olympics,Biniam%20Girmay&hl=en-US`
- Trends API (standalone `Biniam Girmay`, `Eritrea Olympics`, `Eritrean cycling`, `Eritrean athletics`, `Zersenay Tadese`), accessed 2026-11-02: `https://trends.google.com/trends/explore?date=today%205-y&q=Biniam%20Girmay`, `...q=Eritrea%20Olympics`, `...q=Eritrean%20cycling`, `...q=Eritrean%20athletics`, `...q=Zersenay%20Tadese`
- Trends API (Tigrinya-script sports terms `ብሽክለታ ኤርትራ`, `ስፖርት ኤርትራ`), accessed 2026-11-02: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=%E1%89%A5%E1%88%BD%E1%8A%AD%E1%88%88%E1%89%B3%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB`, `...q=%E1%88%B5%E1%8D%96%E1%88%AD%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB`
- YouTube search, accessed 2026-11-02: `https://www.youtube.com/results?search_query=Eritrean+cycling+team`, `https://www.youtube.com/results?search_query=Eritrean+cycling`, `https://www.youtube.com/results?search_query=Biniam+Girmay`, `https://www.youtube.com/results?search_query=Eritrean+athletics`, `https://www.youtube.com/results?search_query=Eritrea+Olympics`, `https://www.youtube.com/results?search_query=Eritrean+national+team+cycling`, `https://www.youtube.com/results?search_query=Eritrean+runners`
- YouTube channel About pages, accessed 2026-11-02: `https://www.youtube.com/@HakiFitewu/about`, `https://www.youtube.com/@cinemasemere/about`, `https://www.youtube.com/@Eritreacycling/about`, `https://www.youtube.com/@Eritreancycling/about`, `https://www.youtube.com/@Gemelsewra/about`, `https://www.youtube.com/@eri-vision-k8j/about`, `https://www.youtube.com/@Erilove1r/about`, `https://www.youtube.com/@eritreansports7859/about`, `https://www.youtube.com/@LasVegasEritreanSports/about`, `https://www.youtube.com/@EritreanTVNews/about`

**Addendum sources (Alexander Isak / Lily Yohannes), accessed 2026-11-02:**
- Trends API (diaspora-heritage 4-way compare `Alexander Isak`, `Lily Yohannes`, `Biniam Girmay`, `Zersenay Tadese`): human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Alexander%20Isak,Lily%20Yohannes,Biniam%20Girmay,Zersenay%20Tadese&hl=en-US`
- Trends API (standalone `Alexander Isak`, `Lily Yohannes`): `https://trends.google.com/trends/explore?date=today%205-y&q=Alexander%20Isak`, `...q=Lily%20Yohannes`
- Trends API (Eritrea-qualified 2-way compare `Alexander Isak Eritrea`, `Lily Yohannes Eritrea`): human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Alexander%20Isak%20Eritrea,Lily%20Yohannes%20Eritrea&hl=en-US`
- YouTube search: `https://www.youtube.com/results?search_query=Alexander+Isak+Eritrea`, `https://www.youtube.com/results?search_query=Alexander+Isak+Eritrean`, `https://www.youtube.com/results?search_query=Lily+Yohannes+Eritrea`, `https://www.youtube.com/results?search_query=Lily+Yohannes+Eritrean`, and generic (scale-context only) `https://www.youtube.com/results?search_query=Alexander+Isak`, `https://www.youtube.com/results?search_query=Lily+Yohannes`
- YouTube channel About pages: `https://www.youtube.com/@Erilink/about`, `https://www.youtube.com/@MrDanyoh/about` (Cinema Semere Media's About page already cited above)
- Identity/heritage confirmation — Wikipedia: `https://en.wikipedia.org/wiki/Alexander_Isak`, `https://en.wikipedia.org/wiki/Lily_Yohannes`
- Identity/heritage confirmation — Dehai News, "Alexander Isak, the humble son of Eritrean refugees, could join Liverpool in a record deal": `http://www.dehai.org/dehai/dehai-news/529944`
- Transfer-date confirmation — Sky Sports, "Alexander Isak joins Liverpool: Newcastle striker leaves in British-record £125m deal on Transfer Deadline Day": `https://www.skysports.com/football/news/11669/13422894/alexander-isak-joins-liverpool-newcastle-striker-leaves-in-british-record-lb125m-deal-on-transfer-deadline-day`; ESPN transfer-saga timeline: `https://www.espn.co.uk/football/story/_/id/46027433/alexander-isak-liverpool-line-newcastle-united-star-transfer-saga-far`
- Family-background/scope confirmation — Defector, "What's Parenting Lily Yohannes Like? An Interview With Her Dad" (confirms father Daniel Yohannes runs "The Yohannes Trio Football Channel" and that son Aethan Yohannes plays for Eritrea's national team): `https://defector.com/whats-parenting-lily-yohannes-like-an-interview-with-her-dad`
- USWNT-commitment confirmation — Stars and Stripes FC, "Lily Yohannes creates excitement after commitment to USWNT": `https://www.starsandstripesfc.com/uswnt-news/2024/11/11/24293835/lily-yohannes-usa-uswnt-commitment-netherlands`

---

## 6. National Holidays (Independence Day, Martyrs' Day, Operation Fenkil and similar national observances)

**Scope note:** per the owner's brief, this section is scoped to Eritrean national holidays/observances specifically — Independence Day (May 24), Martyrs' Day (June 20), and Operation Fenkil / Liberation of Massawa (Feb 10, commonly just "Fenkil") — among Eritrean-diaspora / English-qualified and Tigrinya-relevant search and viewing behavior, not the broader Horn of Africa. This is deliberately treated as its own independent candidate, separate from §5 Sports: solemn national remembrance/celebration programming is a different tonal proposition from athletic entertainment, and the two are not merged into a combined "Events" category anywhere below.

### Summary
Of every term tested in this entire research project, National Holidays is the **only vertical that shows clean, recurring annual seasonality tied to real calendar dates** — "Eritrean Independence Day" and "Independence Day Eritrea" both spike in the May 24 calendar week in every one of the 5 years tested (most recently the 35th-anniversary week in May 2026), and "Fenkil" spikes in the Feb 10 calendar week in every year tested (most recently the 36th-anniversary week in Feb 2026). "Martyrs Day Eritrea" shows the same seasonal pattern but more faintly and more noisily. The generic, undated phrase "Eritrea national holiday" has **zero measurable Trends volume at all**. On YouTube, there is no single dedicated "National Holidays" brand channel, but the niche is far from unserved: Eri-TV already treats all three occasions as recurring incumbent programming (including, for Fenkil specifically, an ongoing 95+ episode dramatized-documentary series), diaspora embassy/community-organization channels post annual city-by-city celebration recaps in the tens of thousands of views, and no channel approaches Eri-TV's or the top Orthodox/News channels' scale.

### Google Trends

**Job: 5-way compare — `Eritrean Independence Day`, `Martyrs Day Eritrea`, `Eritrea national holiday`, `Fenkil`, `Independence Day Eritrea`** (these 5 numbers are directly comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Eritrean Independence Day | 2.17 | 100 (May 21–27, 2023) | 92.4% | 2.07 → 2.27 (+10%, roughly flat overall — but see recurring annual spikes below) |
| Independence Day Eritrea | 1.55 | 69 (May 21–27, 2023) | 90.8% | 1.47 → 1.63 (+11%, roughly flat) |
| Fenkil | 0.66 | 21 (Feb 6–12, 2022) | 93.1% | 0.64 → 0.68 (+6%, roughly flat) |
| Martyrs Day Eritrea | 0.18 | 11 (Jun 19–25, 2022) | 98.1% | 0.15 → 0.21 (+40%, thin, off a near-zero base) |
| Eritrea national holiday | 0.00 | 0 | 100% | **zero search volume for the full 5 years** |

**The standout finding of this section: unlike almost every other term in this entire report, several of these low-average, mostly-zero-week terms are not randomly thin — they spike on the same calendar week every single year.** Looking at the top weekly values per term across the full 5-year timeline:

- `Eritrean Independence Day` top weeks: May 21–27 2023 (100), May 22–28 2022 (88), May 19–25 2024 (79), May 18–24 2025 (56), May 17–23 2026 (39), May 24–30 2026 (38) — **every single one of the top 6 weeks falls in the May 24 calendar week**, one per year, 2022 through 2026.
- `Independence Day Eritrea` top weeks: May 21–27 2023 (69), May 22–28 2022 (54), May 19–25 2024 (49), May 18–24 2025 (36), May 24–30 2026 (28), May 17–23 2026 (18) — same pattern, same weeks.
- `Fenkil` top weeks: Feb 6–12 2022 (100), Feb 4–10 2024 (83), Feb 2–8 2025 (72), Feb 15–21 2026 (70), Feb 1–7 2026 (66), Feb 8–14 2026 (57) — **every one of the top 6 weeks falls in early-to-mid February**, tracking the Feb 10 Operation Fenkil anniversary, one per year.
- `Martyrs Day Eritrea` top weeks: Jun 19–25 2022 (100), Nov 9–15 2025 (85), Dec 15–21 2024 (83), Jun 18–24 2023 (81), Feb 8–14 2026 (77) — the June 20 week does appear with the single highest value, and a second June week (2023) also ranks highly, but unlike the other two terms the remaining top weeks are scattered in November, December, and February with no obvious connection to Martyrs' Day — **the seasonal signal is real but considerably noisier and lower-confidence than Independence Day's or Fenkil's.**
- `Eritrea national holiday` has no weeks above 0 at all — no seasonality to observe because there is no signal.

Standalone (single-term) re-runs: `Eritrean Independence Day` alone is identical to its 5-way figure (avg 2.17, same max/trend — it's large enough relative to the other 4 terms that adding them to the comparison doesn't rescale its curve). `Martyrs Day Eritrea` alone averages **1.63** (vs. 0.18 in the 5-way job — the same normalization effect documented elsewhere in this report, e.g. `Tigrinya news` 44.9 standalone vs. 8.0 in its 3-way job), max 100 (Jun 19–25, 2022), 98.1% zero weeks, same top-weeks pattern as above. `Fenkil` alone averages **3.17** (vs. 0.66 in the 5-way job), max 100 (Feb 6–12, 2022), 92.7% zero weeks, same February-recurring top weeks.

**Geo breakdown (5-way compare job, values are `[Independence Day, Martyrs Day, national holiday, Fenkil, Independence Day Eritrea]`):**

| Country | Values |
|---|---|
| United States | [56, 2, 1, 13, 28] |
| Ethiopia | [46, 0, 0, 24, 30] |
| Germany | [33, 0, 0, 20, 47] |
| Netherlands | [34, 0, 0, 20, 46] |
| Sweden | [0, 0, 0, 0, 0] |
| Canada | [0, 0, 0, 0, 0] |
| United Kingdom | [0, 0, 0, 0, 0] |
| Israel | [0, 0, 0, 0, 0] |
| Italy | [0, 0, 0, 0, 0] |
| Sudan | [0, 0, 0, 0, 0] |
| Eritrea | [0, 0, 0, 0, 0] |

As with `Biniam Girmay` in §5, Eritrea itself shows 0 across the board in this shared-scale breakdown — this reads as the same normalization artifact (the English-qualified Independence Day terms draw real volume from several large diaspora/Ethiopia populations that swamps Eritrea's smaller absolute volume once a shared 0–100 scale is set), not evidence of zero domestic interest, and is confirmed by the standalone geo check below. Named diaspora hubs are a mixed picture here: US, Germany, and the Netherlands show real, nonzero signal on the Independence Day terms; Sweden, Canada, UK, Israel, Italy, and Sudan do not.

**Standalone geo for `Fenkil`:** Eritrea = 100, every other country including Ethiopia and every named diaspora hub = 0 — a **clean, Eritrea-specific signal**, on par with `Eritrean Orthodox`, `Eritrean music`, and `Biniam Girmay` elsewhere in this report.

**Standalone geo for `Eritrean Independence Day` and `Martyrs Day Eritrea`:** both return noisy, low-confidence single-country spikes (Montserrat and the British Virgin Islands respectively, each at index 100 off what is almost certainly one or two searches) with every named diaspora hub and Eritrea itself at 0 — the same low-confidence-noise pattern flagged in the Methodology section (c.f. Tuvalu/Cape Verde, and the generic sports-category terms in §5). These two terms' real audience is visible in the 5-way shared-scale table above (US/Ethiopia/Germany/Netherlands), not in their own standalone geo breakdowns.

**Tigrinya/Ge'ez-script check:** two script phrasings were tested standalone — `ናጽነት ኤርትራ` ("Independence Eritrea") and `ሰማዕታት ኤርትራ` ("Martyrs Eritrea"). Both are extremely thin (avg 0.38, 99.6% zero-volume weeks) and — critically — **neither term's single spike lines up with the actual holiday date**: `ናጽነት ኤርትራ` peaks the week of Jul 23–29, 2023 (not May) and `ሰማዕታት ኤርትራ` peaks the week of Dec 12–18, 2021 (not June). Both returned **no geo data at all for any country, Eritrea included** — the same "too thin even to tell where it's coming from" pattern found for the Ge'ez-script sports terms in §5, and unlike the Ge'ez-script terms in Religion/Music/News, which at least returned a usable (if Ethiopia-dominated) geo breakdown. Net finding for Holidays: as with every other vertical in this report, English-qualified phrasing is the far better proxy for Eritrean-diaspora search demand than Ge'ez-script phrasing — here the gap is especially stark because the script queries don't even reproduce the one pattern (annual seasonality) that makes this vertical distinctive in English.

No related-queries data available for any of the 7 terms tested (empty `rankedKeyword` list for every one), consistent with every other term in this research.

### YouTube

**Independence Day (May 24) — diaspora/embassy celebration coverage plus Eri-TV's own commemoration programming:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Eri-TV, Eritrea (Official) | 726K (see §4) | ~21,000 (see §4) | "ወግዓዊ ጽንብል በዓል ናጽነት መበል 33 ዓመት \| The 33rd Independence Day anniversary celebrations" at 200,174 views (2y ago); script-search also surfaces a 32nd-anniversary variety/music special at 411,508 views (3y ago) |
| Eritrea EmbassyMedia (official embassy channel) | 80.1K | 606 | broader diaspora-outreach channel, not Independence-Day-exclusive |
| Eritrean Unity Worldwide EPLF1 | 57.4K | 857 | diaspora-organization channel; multiple separate recap clips of the "35th Eritrean Independence Day" embassy celebration in Washington DC (May 2026), individual clips ranging 7,999–67,012 views, all posted within the same ~5-month window |
| Savana Millygo Entertainment | 42.4K | 203 | "ቶሮንቶ ጽንብል በዓል ናጽነት... Eritrean Independence day in Toronto 2026" at 34,542 views |
| Dimtsi Hafash Entertainment | 1.63K | 63 | "ERi-TV Eritrea Independence Day 2026 Celebration \| New Eritrean Music & Tigrigna Songs Live" at 7,081 views |
| Teame Tesfamariam | 3.23K | 91 | (profiled primarily under Martyrs' Day below; also posts Independence-Day-adjacent diaspora recaps) |
| Madote Eritrea (legacy) | — | — | a 15-year-old "Eritrean Independence Day Celebrations" upload still shows 69,837 views; the channel itself appears effectively dormant/renamed today — a channel now carrying the "Madote Eritrea" name has only 120 subscribers and 1 video |
| Futsum Photography, EritreaNEXT, Teklit Girmazion, MEHRAM CHIRA, Yemane Fecadu, Merhawi Tesfamariam | individual/small community videographers, no subscriber counts pulled (not dedicated media brands) | — | one-off single-city community-celebration recaps (Minnesota, Oakland CA, the Netherlands, Seattle), 3,261–17,526 views each, all posted within the same ~5-month window around the 35th-anniversary (May 2026) celebrations — the same single-event, single-community pattern as the smallest Protestant/Evangelical church channels in §1 and the smallest Sports channels in §5 |

**Martyrs' Day (June 20):**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Eri-TV, Eritrea (Official) | 726K (see §4) | ~21,000 (see §4) | "ወግዓዊ ስነ-ስርዓት መዓልቲ ሰማእታት - Official Commemoration Of Martyrs' Day, June 20, 2019" at 90,084 views; a 2020 Martyrs'-Day tribute music/variety special at 203,112 views |
| Eritrean News by Eri-TV Live Television | 97.9K (see §5) | 2,963 (see §5) | "ኤርትራ The meaning of 20 Sene - Eritrean Martyr Day" at 186,038 views (13y old) |
| Kosta Entertainment | 79.4K | 490 | annual "NEW ERITREAN VIDEO JUNE 20 ERITREAN MARTYRS DAY" tribute-song releases; four separate 2026-edition uploads (4mo old at access time) at 18,935–55,493 views each |
| Teame Tesfamariam | 3.23K | 91 | single-city diaspora recap: "Eritrean Martyrs Day in London UK" — 12,091 views (2025 edition), 5,791 views (2026 edition) |

**Fenkil / Operation Fenkil (Feb 10):**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Eri-TV, Eritrea (Official) | 726K (see §4) | ~21,000 (see §4) | runs "ፈንቅል" as an **ongoing numbered dramatized-documentary series** re-telling the 1990 Massawa campaign — part 95 was posted 6 days before access, individual episodes draw 17,583–85,384 views; separately, an annual anniversary special ("መበል 36 ዓመት ዝኽሪ ስርሒት ፈንቅል") at 208,998 views (streamed 8mo ago, i.e. around the 36th anniversary in Feb 2026); a Fenkil-themed music video clip at 1,376,720 views (6y old) |
| Cinema Semere Media | 189K (see §5) | 5,264 (see §5) | "Eritrea's 36th Fenkil Anniversary Festival - Beach Celebration & Interviews" at 12,605 views (8mo ago) |
| Eri link - ኤሪ ሊንክ | not pulled | not pulled | "Eritrea: 36th Operation Fenkil Anniversary - Part 3" at 61,590 views (8mo ago) |
| Salina Eritrea | not pulled | not pulled | legacy compilation "MeniKaye - Operation Fenkil, Massawa-Eritrea, February 1990" at 220,442 views (12y old) |
| Eritrea EmbassyMedia | 80.1K (see above) | 606 (see above) | a Fenkil-themed tribute music video (Rezene Alem) at 42,441 views (4y old) — music/tribute content, not documentary |

**Important caveat specific to Fenkil:** because "Fenkil" is also the title of Eri-TV's own long-running (95+ episode, still actively airing) dramatized-documentary series about the 1990 campaign, a meaningful share of this term's Trends search volume and YouTube view volume is plausibly driven by an ongoing scripted/dramatized production rather than purely by annual-observance commemoration content the way Independence Day and Martyrs' Day are — this is a genuine ambiguity in the term, not a data-quality problem, and is flagged here rather than ignored.

**Tigrinya/Ge'ez-script YouTube check:** unlike the "script = Ethiopia-contaminated" pattern found for Religion/Music/News, `ናጽነት ኤርትራ` (Independence Eritrea) YouTube search surfaces clearly legitimate, high-view **Eritrean** content — Eri-TV's own 32nd-anniversary special (411,508 views) and multiple diaspora community-celebration clips — i.e. low Google-text-search volume for this script phrase (see Trends above) does not mean there is no Eritrean-specific YouTube supply findable by it. `ሰማዕታት ኤርትራ` (Martyrs Eritrea) YouTube search is noisier: alongside genuine Eritrean Martyrs'-Day content it surfaces some Amharic-language Ethiopian Orthodox devotional content (e.g. a "ለጻድቃን ሰማዕታት" hymn at 60,486 views) and several low-view, topically ambiguous results — a partial, not clean, signal.

### Sources (National Holidays)
- Trends API (holidays 5-way compare), accessed 2026-11-02: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Independence%20Day,Martyrs%20Day%20Eritrea,Eritrea%20national%20holiday,Fenkil,Independence%20Day%20Eritrea&hl=en-US`
- Trends API (standalone `Eritrean Independence Day`, `Martyrs Day Eritrea`, `Fenkil`), accessed 2026-11-02: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Independence%20Day`, `...q=Martyrs%20Day%20Eritrea`, `...q=Fenkil`
- Trends API (Tigrinya-script holiday terms `ናጽነት ኤርትራ`, `ሰማዕታት ኤርትራ`), accessed 2026-11-02: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=%E1%8A%93%E1%8C%BD%E1%8A%90%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB`, `...q=%E1%88%B0%E1%88%9B%E1%8B%95%E1%89%B3%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB`
- YouTube search, accessed 2026-11-02: `https://www.youtube.com/results?search_query=Eritrean+Independence+Day`, `https://www.youtube.com/results?search_query=Eritrea+Independence+Day+celebration`, `https://www.youtube.com/results?search_query=Martyrs+Day+Eritrea`, `https://www.youtube.com/results?search_query=Fenkil+Eritrea`, `https://www.youtube.com/results?search_query=%E1%8A%93%E1%8C%BD%E1%8A%90%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB` (ናጽነት ኤርትራ), `https://www.youtube.com/results?search_query=%E1%88%B0%E1%88%9B%E1%8B%95%E1%89%B3%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB` (ሰማዕታት ኤርትራ)
- YouTube channel About pages, accessed 2026-11-02: `https://www.youtube.com/@DimtsiHafashEntertainment/about`, `https://www.youtube.com/@EritreaEmbassyMedia/about`, `https://www.youtube.com/@eritreanunityworldwideeplf1/about`, `https://www.youtube.com/@kosta772/about`, `https://www.youtube.com/@millygorecords7695/about`, `https://www.youtube.com/@teametesfamariam8283/about`, `https://www.youtube.com/@madoteeritrea8397/about` (Eri-TV main channel, Eritrean News by Eri-TV Live Television, and Cinema Semere Media figures reused from §4 and §5, same channel pages cited there)

---

## 7. Side-by-side comparison

**Reminder on comparability:** the "Trends avg (cross-category)" column below is the only Trends number in this table that is directly comparable across rows — it comes from the single 4-way query that put Orthodox/Music/Podcast/News on one shared 0–100 scale (see §4). Catholic and Protestant were not part of that query (they were compared only against each other and Orthodox in the separate 5-way religion query, §1); Sports was likewise not part of that query (it was compared only against itself in the separate 5-way sports query, §5); National Holidays was likewise not part of that query (it was compared only against itself in the separate 5-way holidays query, §6); the three Church seminar/teaching rows (§8) were likewise not part of that query (they were compared only against each other in §8's own 5-way and 4-way jobs). Catholic's, Protestant's, Sports', National Holidays', and the seminar/teaching rows' relative position vs. Music/Podcast/News is **not directly measurable from this data** and is marked accordingly.

**Important distinction for the three "seminar/teaching" rows below (added in the §8 research pass):** these measure demand for a **different content genre** than the "Religion — Orthodox/Catholic/Protestant" rows already in this table. The original Religion rows (§1) measured *mezmur* (devotional music/hymn) content and general denominational search terms. The seminar/teaching rows (§8) measure *sermon/teaching/seminar* content specifically (clergy preaching, scripture study, theological teaching) — explicitly excluding music and excluding liturgical/holiday observance footage. Both sets of rows are kept, side by side, rather than merged or overwritten, precisely so they are not conflated.

| Vertical | Trends avg (cross-category scale, where available) | Trends 5y trend | YouTube supply / top channel | Apparent whitespace | Queries used (Trends / YouTube) |
|---|---|---|---|---|---|
| **News** | 19.0 (highest, tied with Music) | **Rising** (+105%, "Eritrea news") | **Most saturated**: Eri-TV 726K subs, ~21K videos, daily uploads | Low — dominant incumbent already exists | Trends: `Eritrea news`, `Tigrinya news`, `ዜና ኤርትራ` (3-way); also in the 4-way cross-category job (§4) alongside `Eritrean Orthodox`, `Eritrean music`, `Eritrean podcast`. YouTube: `Eritrea news Tigrinya`, `ዜና ኤርትራ` |
| **Music (general "Eritrean music")** | 18.5 | **Declining** (-20%) | Fragmented: largest dedicated channel ~65K subs; no channel >~65K found; individual old-song videos still pull 300K–2.2M views | **Possible**: strong per-video view appetite, no consolidated "decade nostalgia" brand | Trends: 4-way decade compare `Tigrinya music 90s`, `Eritrean music 80s`, `Eritrean music 70s`, `Eritrean music 2000s`; standalone `Eritrean music`, `Tigrinya music`, `ሙዚቃ ትግርኛ`. YouTube: `Eritrean music 80s`, `Eritrean music 90s`, `ሙዚቃ ትግርኛ` |
| **Religion — Orthodox** | 10.2 | Rising (+18%) | **Highly saturated**: multiple channels 100K–139K subs, mezmur videos regularly 1M–5.7M views | Low — well-served | Trends: 5-way `Eritrean Orthodox`, `Eritrean Catholic`, `Eritrean Protestant`, `Eritrean Evangelical`, `EOTC`; script compare `ተዋህዶ ቤተ ክርስትያን` vs `ኦርቶዶክስ ተዋህዶ`. YouTube: `Eritrean Orthodox Tewahedo`, `ኦርቶዶክስ ተዋህዶ ኤርትራ` |
| **Sports (cycling/athletics/Olympics; plus diaspora-heritage players addendum)** | not in cross-category query; internal 5-way range 0.0 (generic category terms, e.g. "Eritrean cycling," "Eritrean athletics") to 3.6 (`Biniam Girmay` — the one term that actually carries the category); separately, the 2026-11-02 addendum found `Alexander Isak` at a much higher 6.1 avg in its own 4-way job (not directly comparable to the 3.6 above — different job, see Methodology) | **Rising for the terms that matter**: `Biniam Girmay` +67% (1st→2nd half); `Eritrea Olympics` thin but rising off a near-zero base; generic category terms flat at ~0; addendum: `Alexander Isak` +246% (clearly rising, peak = his Sep 2025 Newcastle→Liverpool transfer), `Lily Yohannes` +515% off a thin base (peak = her Jun 2024 USWNT goal) | Thin and split: largest Eritrea-relevant channel is Cinema Semere Media (189K subs, not sports-exclusive); largest sports-specialist channel is Haki Fitewu (25.3K subs, 155 videos); Eri-TV's main channel already broadcasts the national cycling championship as recurring programming; addendum: only two Eritrean-run videos found naming Isak or Yohannes specifically (Eri link - ኤሪ ሊንክ, 105K subs; Cinema Semere Media), plus a small family-run channel (@MrDanyoh, 803 subs) operated by Yohannes's own father | **Possible but name-driven, and scope-contested for the addendum pair**: real demand exists but is concentrated in individual athletes' fame, not a category brand; no consolidated Eritrean-run sports-media channel exists (the two channels literally named "Eritrean Sports" have 30 and 8 subscribers). Isak and Yohannes carry far larger raw search volume than Girmay/Tadese, but both play for other countries (Sweden, USA) rather than Eritrea — notably, Yohannes's own brother Aethan plays for Eritrea's national team, making this a live scope question (diaspora/heritage stars vs. Eritrea-only roster) for the owner to resolve, not one this research settles | Trends: 5-way `Eritrean cycling`, `Eritrean athletics`, `Eritrean national team`, `Eritrea Olympics`, `Biniam Girmay`; standalone added `Zersenay Tadese`; script `ብሽክለታ ኤርትራ`, `ስፖርት ኤርትራ`. YouTube: `Eritrean cycling team`, `Eritrean cycling`, `Biniam Girmay`, `Eritrean athletics`, `Eritrea Olympics`, `Eritrean national team cycling`, `Eritrean runners`. **Addendum (2026-11-02):** Trends 4-way `Alexander Isak`, `Lily Yohannes`, `Biniam Girmay`, `Zersenay Tadese`; standalone `Alexander Isak`, `Lily Yohannes`; 2-way `Alexander Isak Eritrea`, `Lily Yohannes Eritrea`. YouTube: `Alexander Isak Eritrea`, `Alexander Isak Eritrean`, `Lily Yohannes Eritrea`, `Lily Yohannes Eritrean`, plus generic `Alexander Isak`/`Lily Yohannes` for scale context |
| **Religion — Catholic** | not in cross-category query; 0.1 in religion-only 5-way (vs Orthodox 9.3) | Thin/rising off near-zero base | Thin: largest channel 33.3K subs, catalog mostly 9–13 years old | **Possible**: real but small signal, visibly stale content library | Trends: same 5-way as Orthodox, row `Eritrean Catholic`. YouTube: `Eritrean Catholic` |
| **Religion — Protestant/Evangelical** | not in cross-category query; 0.0 in religion-only 5-way | **No measurable Trends signal at all** (zero for 5 years) | Most fragmented: largest channel 8.05K subs, all single-congregation livestreams, view counts in the hundreds | **Possible on supply side**, but no Trends evidence of search demand to justify it | Trends: same 5-way as Orthodox, rows `Eritrean Protestant` and `Eritrean Evangelical`. YouTube: `Eritrean Protestant church`, `Eritrean Evangelical` |
| **Podcasters** | 0.0 (flat, statistically indistinguishable from zero) | Flat/no signal | Moderate: one breakout (Kezahta, 161K subs), several small/inconsistent shows | Ambiguous — real YouTube engagement (Kezahta) despite zero Google-search demand; people may be finding these through YouTube/social directly rather than Googling | Trends: 3-way `Eritrean podcast`, `Tigrinya podcast`, `ፖድካስት`. YouTube: `Eritrean podcast`, `ፖድካስት ትግርኛ` |
| **National Holidays (Independence Day / Martyrs' Day / Fenkil)** | not in cross-category query; internal 5-way range 0.0 ("Eritrea national holiday") to 2.17 ("Eritrean Independence Day") | **The only clean, recurring annual-seasonality signal in this report**: `Eritrean Independence Day` and `Fenkil` both spike in the same calendar week (May 24 / Feb 10) every year tested, 2022–2026; `Martyrs Day Eritrea` shows the same pattern more faintly and noisily; `Eritrea national holiday` has zero measurable volume | Thin and split, same incumbent-saturation shape as Sports: Eri-TV already covers all three occasions as recurring programming (including a 95+ episode ongoing "Fenkil" documentary series); largest Eritrea-relevant non-Eri-TV channel is Eritrea EmbassyMedia (80.1K subs) and Eritrean Unity Worldwide EPLF1 (57.4K subs, annual embassy-celebration recaps); no channel is a dedicated "National Holidays" brand | **Possible but date-concentrated**: real, calendar-anchored demand exists and recurs predictably, but it is highly seasonal (most of the year is near-zero) rather than evergreen, and incumbent coverage (Eri-TV, embassy/diaspora-org channels) already exists for the biggest moments | Trends: 5-way `Eritrean Independence Day`, `Martyrs Day Eritrea`, `Eritrea national holiday`, `Fenkil`, `Independence Day Eritrea`; script `ናጽነት ኤርትራ`, `ሰማዕታት ኤርትራ`. YouTube: `Eritrean Independence Day`, `Eritrea Independence Day celebration`, `Martyrs Day Eritrea`, `Fenkil Eritrea`, `ናጽነት ኤርትራ`, `ሰማዕታት ኤርትራ` |
| **Church seminar/teaching — Orthodox** (§8 — distinct genre from "Religion — Orthodox" row above, which is mezmur/general-term demand) | not in cross-category query; own 5-way/4-way jobs range 0.0 ("Eritrean Orthodox seminar", empty) to 0.76 ("Eritrean Orthodox teaching") | **No measurable trend of any kind** — every term is an isolated single-week spike off a 99%+-zero-weeks base, not a sustained rise or decline, and markedly thinner than the general "Eritrean Orthodox" term in §1 (avg 35.4 standalone) | Fragmented sub-genre riding on existing mezmur-first channels, not a dedicated brand: Anastasia ኣናስታስያ (54.4K subs, 736 videos) hosts a recurring numbered "NEW SBKET" (sermon) series by named clergy (views 6K–40K, very actively updated), but the same channel's view-share is dominated by children's-choir mezmur (1M–2.5M views/video); Medlote Amin (104K, §1) and Eritrean Orthodox Tewahdo ቤት ፍቕሪ እግዚኣብሄር (130K, §1) each post occasional sermon content as a minority of their catalog | No clean single-source teaching channel exists (unlike Kezahta for Podcasters) — supply is a byproduct of channels whose primary draw is mezmur | Trends: 5-way `Eritrean Orthodox sermon` job, 4-way `Eritrean Orthodox teaching`/`seminar` job, standalone reruns, script `ትምህርተ ክርስቶስ`. YouTube: `Eritrean Orthodox sermon`, `Eritrean Orthodox teaching`, `Eritrean Orthodox priest teaching`, `ቀሲስ ዕርዶም ዑቅባሚካኤል` |
| **Church seminar/teaching — Catholic** (§8 — distinct genre from "Religion — Catholic" row above) | not in cross-category query; own 5-way/4-way jobs range 0.0 ("Eritrean Catholic seminar", empty) to 0.37 ("Eritrean Catholic teaching") | **No measurable trend** — same near-zero, single-spike pattern as Orthodox/Protestant in this section, thinner than the general "Eritrean Catholic" term in §1 (avg 2.5 standalone) | Fragmented across several small (5K–20K-subscriber) channels organized around individual priests rather than a brand: Abba Yonas Yohannes's sermons recur across at least 3 channels (E.H, ዓይኒ-ማይ "AyniMay Tube," Eritrean Catholic Charismatic Renewal); catholicgheez (10.8K subs, 1,388 videos, since 2009) carries the Abba Teclezghi sermon series but is legacy-heavy; ዓይኒ-ማይ/AyniMay Tube (19.5K subs, 898 videos) is the closest thing to a standing devotional/teaching channel but is not seminar-exclusive and draws modest views (1.4K–8.3K/stream) | No clean single-source channel; fragmented by preacher, not consolidated by brand | Trends: same 5-way/4-way jobs as Orthodox, rows `Eritrean Catholic sermon`/`teaching`/`seminar`. YouTube: `Eritrean Catholic sermon`, `Eritrean Catholic teaching`, `Eritrean Catholic homily` |
| **Church seminar/teaching — Protestant/Evangelical** (§8 — distinct genre from "Religion — Protestant/Evangelical" row above) | not in cross-category query; own 5-way job: 0.38 ("Eritrean Protestant sermon") vs. 0.0/empty ("Eritrean Evangelical sermon", "Eritrean Bible study") | **No measurable Trends signal** — `Eritrean Evangelical sermon` and `Eritrean Bible study` returned literally empty timelines, the same "confirmed zero" class of finding as `Eritrean Protestant` in §1; this holds (if anything more strongly) for teaching-specific phrasing too | Most fragmented by ownership, but with a real concentrated-demand signal absent elsewhere in religion: individual-congregation channels (Gospel Light Baptist Dallas 8.05K, Ebenezer DC 9.22K, Rehabot Church Stockholm 6.55K, Mulue Wengel Stuttgart 4.99K — all §1-pattern single-congregation channels) each post individual sermon videos; one traveling preacher, **Pastor Goitom Gebreyonas**, draws 10K–170K views per sermon — 10-20x a typical single-congregation video — but his content is scattered across at least 8–10 different host-church channels he does not own, none of which carries only his content | **Possible but name-driven, not channel-driven** (same shape as Girmay in Sports): real concentrated audience demand exists for one preacher, but no single channel — his own or anyone else's — aggregates it | Trends: 5-way sermon job (same as Orthodox/Catholic), `Eritrean Evangelical sermon`, `Eritrean Bible study`. YouTube: `Eritrean Evangelical sermon`, `Eritrean Protestant sermon`, `Eritrean pastor teaching Tigrinya`, `Pastor Goitom Gebreyonas` |

### Categories where data was too thin to compare on equal footing
- **Eritrean Protestant / Eritrean Evangelical**: confirmed genuinely zero Google Trends search volume over 5 years (not a tooling failure — the standalone `Eritrean Protestant` query returned a literally empty timeline from Trends' own API). Any decision to add Protestant/Evangelical content cannot be backed by Trends search-demand data; it would have to rest on other signals (e.g. YouTube engagement, community outreach) not gathered here.
- **Decade-specific music qualifiers** (`Eritrean music 70s/80s/90s/2000s`, `Tigrinya music 90s`): each is >95% zero-volume weeks on Trends — too thin to compare against each other or against the other verticals on Trends alone. The whitespace read on decade-nostalgia music rests on YouTube view-count evidence, not Trends.
- **Generic sports-category terms** (`Eritrean cycling`, `Eritrean athletics`, `Eritrean national team`): each is 98–100% zero-volume weeks on Trends, same order of thinness as the decade-music qualifiers above. Unlike music, however, Sports has one specific-name term (`Biniam Girmay`) that is not thin at all (16.0% zero weeks, clear rising trend, clean Eritrea-concentrated standalone geo) — so the Sports whitespace read rests on a mix of one real Trends signal (the athlete's name) plus YouTube evidence, rather than on YouTube alone the way decade-nostalgia music does.
- **Church seminar/teaching terms, all three denominations (§8)**: every English phrasing tested (`sermon`, `teaching`, `seminar`, `Bible study`, crossed with Orthodox/Catholic/Protestant/Evangelical) is 99–100% zero-volume weeks on Trends — thinner than even the general denominational terms in §1. `Eritrean Evangelical sermon`, `Eritrean Bible study`, `Eritrean Orthodox seminar`, and `Eritrean Catholic seminar` each returned a literally empty timeline, the same "confirmed zero" class of finding as `Eritrean Protestant` (§1) and `Eritrea national holiday` (§6) elsewhere in this report. The one related term with real volume, generic Ge'ez-script `ስብከት` ("sermon," avg 37.05), is Ethiopia-dominated (geo share ≈99% Ethiopia) and collapses back to near-zero (avg 0.38) once qualified with `ኤርትራ` — the same script-contamination pattern documented throughout this report. The whitespace/fragmentation read for this content type therefore rests entirely on YouTube supply evidence, not on Trends.
- **`Eritrea national holiday`** (§6): 100% zero-volume weeks over the full 5 years — a literally flat timeline, the same order of "confirmed zero" finding as `Eritrean Protestant`. The undated, generic phrasing of this term carries no measurable demand at all; the real National Holidays signal lives entirely in the dated/named terms (`Eritrean Independence Day`, `Fenkil`, `Martyrs Day Eritrea`).
- **Related-queries/related-topics breakdowns**: unavailable (empty) for every single term tested across all six verticals — Google Trends is reporting all of these as below its volume threshold for that specific breakdown. This limits how much "adjacent demand" signal could be extracted beyond the geo and timeseries data already reported.
- **Tigrinya/Ge'ez-script queries generally**: for religion, music, and news, script-based queries turned out to be dominated by Ethiopia/Tigray rather than Eritrea (religion: `ኦርቶዶክስ ተዋህዶ` → ET=100, ER=0; music: `ሙዚቃ ትግርኛ` → ET=100, ER=0; news: `ዜና ኤርትራ` → near-zero everywhere). Sports and National Holidays are both partial exceptions, in different ways: Sports' two Ge'ez-script terms (`ብሽክለታ ኤርትራ`, `ስፖርት ኤርትራ`) were too thin to return a geo breakdown at all (not even an Ethiopia signal), and Holidays' two Ge'ez-script terms (`ናጽነት ኤርትራ`, `ሰማዕታት ኤርትራ`) were likewise too thin for any geo breakdown — but additionally their one-off spikes don't even land on the actual holiday dates (July 2023 and December 2021, not May or June), so script-based holiday search on Trends doesn't reproduce the one pattern (annual seasonality) that makes this vertical distinctive. (On YouTube, by contrast, `ናጽነት ኤርትራ` does surface clean, high-view Eritrean content — see §6 — so the Trends thinness there reflects low *text-search* volume specifically, not an absence of Eritrean-run content findable by that phrase.) This is a genuine finding, not a gap: it means English-qualified phrasing ("Eritrean Orthodox," "Eritrea news," "Eritrean music," "Eritrean Independence Day," and — for Sports — a specific athlete's name like "Biniam Girmay") is currently the better proxy for Eritrean-diaspora-specific demand than Ge'ez-script phrasing, at least on Google Trends' search surface.

---

## 8. Church seminar/teaching content (Orthodox, Catholic, Protestant)

**Scope note:** per the owner's brief, this section measures demand and supply for **sermon/teaching/seminar content specifically** — clergy preaching, scripture/Bible study, theological teaching series, seminar/conference talks — across the same three denominations covered in §1. It deliberately **excludes** mezmur/devotional music (already covered in §1), general denominational search terms (already covered in §1), and liturgical/holiday observance footage (out of scope per the brief; covered separately by the Holidays effort in §6). Where a search or channel turned out to be dominated by music or by translated non-Eritrean clergy content rather than Eritrean-clergy teaching, that is flagged explicitly below rather than counted as clean supply.

### Summary
Google Trends shows **no measurable search demand for seminar/teaching-specific phrasing for any of the three denominations** — every English term tested (`sermon`, `teaching`, `seminar`, `Bible study`, crossed with Orthodox/Catholic/Protestant/Evangelical) sits at 99–100% zero-volume weeks, thinner than even the general denominational terms §1 found for Orthodox and Catholic, and in several cases (`Eritrean Evangelical sermon`, `Eritrean Bible study`, `Eritrean Orthodox seminar`, `Eritrean Catholic seminar`) the timeline is **literally empty** — the same "confirmed zero" finding §1 made for the general term "Eritrean Protestant." That zero-signal result holds across all three denominations alike; unlike §1, this section found no Trends-based way to rank Orthodox/Catholic/Protestant against each other on search demand for this genre specifically. On YouTube, supply is real but structured very differently from §1's mezmur findings: **no denomination has a clean, dedicated, single-source teaching/seminar channel.** Orthodox and Catholic supply is a minority sub-genre riding inside channels whose primary draw and view-share is mezmur or general parish content; Protestant/Evangelical supply is split across many single-congregation channels, but shows a genuine concentrated-demand signal in one specific traveling preacher (Pastor Goitom Gebreyonas) whose sermons dramatically outperform typical single-congregation content wherever they are hosted — but he does not own any of the channels that carry them.

### Google Trends

**Job: 5-way compare — `Eritrean Orthodox sermon`, `Eritrean Catholic sermon`, `Eritrean Protestant sermon`, `Eritrean Evangelical sermon`, `Eritrean Bible study`** (these 5 numbers are directly comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half avg → 2nd half avg) |
|---|---|---|---|---|
| Eritrean Protestant sermon | 0.38 | 100 (Dec 29–Jan 4, 2024/25) | 99.6% | 0.0 → 0.76 (thin, off a zero base) |
| Eritrean Catholic sermon | 0.34 | 90 (Jan 30 – Feb 5, 2022) | 99.6% | 0.69 → 0.0 (thin, declining off a near-zero base) |
| Eritrean Orthodox sermon | 0.24 | 62 (Nov 13–19, 2022) | 99.6% | 0.47 → 0.0 (thin, declining off a near-zero base) |
| Eritrean Evangelical sermon | 0.0 | 0 | 100% | **zero search volume for the full 5 years** |
| Eritrean Bible study | 0.0 | 0 | 100% | **zero search volume for the full 5 years** |

**Job: 4-way compare — `Eritrean Orthodox teaching`, `Eritrean Catholic teaching`, `Eritrean Orthodox seminar`, `Eritrean Catholic seminar`** (comparable to each other):

| Term | 5y avg index | Max (date) | % of weeks at 0 |
|---|---|---|---|
| Eritrean Orthodox teaching | 0.76 | 100 (Mar 31 – Apr 6, 2024) | 99.2% |
| Eritrean Catholic teaching | 0.37 | 98 (Nov 26 – Dec 2, 2023) | 99.6% |
| Eritrean Orthodox seminar | 0.0 | 0 | 100% (no data) |
| Eritrean Catholic seminar | 0.0 | 0 | 100% (no data) |

Standalone (single-term) re-runs confirm the same order of magnitude: `Eritrean Orthodox sermon` alone averages 0.38 (max 100, same Nov 13, 2022 date, 99.6% zero weeks); `Eritrean Catholic sermon` alone averages 0.38 (max 100, same Jan 30, 2022 date); `Eritrean Protestant sermon` alone averages 0.38 (max 100, same Dec 29, 2024 date); `Eritrean Orthodox teaching` alone averages 0.76 (identical to the 4-way figure — same pattern noted elsewhere in this report where the largest term in a thin job isn't rescaled by the others); `Eritrean Catholic teaching` alone averages 0.38 (max 100, same Nov 26, 2023 date). Four terms returned a **completely empty standalone timeline** (`timelineData: []`) — Trends has no data at all for `Eritrean Evangelical sermon`, `Eritrean Bible study`, `Eritrean Orthodox seminar`, or `Eritrean Catholic seminar` — the same empty-timeline finding §1 made for the bare term "Eritrean Protestant."

**Geo breakdown:** in both the 5-way sermon job and the 4-way teaching/seminar job, every named diaspora hub (US, DE, SE, IL, GB, SD, ET, CA, NL, IT, ER) returns **0 for every term**, including Eritrea itself. Standalone re-runs of every term above reproduce the same all-zero geo result for every named hub. Unlike §1 (where standalone `Eritrean Orthodox` showed a clean ER=45 signal) or §5/§6 (where `Biniam Girmay` and `Fenkil` showed ER=100 signals), **none of the seminar/teaching terms carry enough volume to populate a geo breakdown at all** — this is a stronger/thinner "no signal" finding than anything else in this report except the fully-empty terms.

**Tigrinya/Ge'ez-script check — Job: 3-way compare `ትምህርተ ክርስቶስ` (Christian teaching/catechism), `ስብከት` (generic word for "sermon/preaching"), `ትምህርተ መጽሓፍ ቅዱስ` (Bible-study teaching):**

| Term | 5y avg index | Max (date) | % of weeks at 0 | Trend (1st half → 2nd half) |
|---|---|---|---|---|
| ስብከት | 37.05 | 100 (Dec 18–24, 2022) | 31.3% | 34.02 → 40.08 (+18%, rising) |
| ትምህርተ መጽሓፍ ቅዱስ | 0.25 | 65 (Dec 19–25, 2021) | 99.6% | 0.5 → 0.0 (thin, declining off a near-zero base) |
| ትምህርተ ክርስቶስ | 0.0 | 0 | 100% | **zero search volume for the full 5 years** (empty timeline) |

`ስብከት` is the only term in this entire §8 research pass with real, sustained Trends volume — but its geo breakdown (job values `[ትምህርተ ክርስቶስ, ስብከት, ትምህርተ መጽሓፍ ቅዱስ]`) shows **Ethiopia = [1, 99, 0]**, with every named diaspora hub including Eritrea at 0 for all three terms. This is the **same script-contamination pattern documented throughout this report** (c.f. `ኦርቶዶክስ ተዋህዶ`, `ሙዚቃ ትግርኛ`, `ዜና ኤርትራ` all skewing Ethiopia): "ስብከት" is simply the generic Amharic/Tigrinya word for "sermon," and its volume is being driven almost entirely from inside Ethiopia, not by the Eritrean diaspora.

**Follow-up — 2-way compare, Eritrea-qualified script terms: `ስብከት ኤርትራ`, `ትምህርተ ክርስቶስ ኤርትራ`:**

| Term | 5y avg index | Max (date) | % of weeks at 0 |
|---|---|---|---|
| ትምህርተ ክርስቶስ ኤርትራ | 0.41 | 57 (Nov 14–20, 2021) | 99.2% |
| ስብከት ኤርትራ | 0.38 | 100 (Oct 19–25, 2025) | 99.6% |

Qualifying `ስብከት` with `ኤርትራ` ("Eritrea") **collapses its volume from avg 37.05 down to avg 0.38** — confirming the unqualified term's volume genuinely is Ethiopia-general, not an artifact of normalization. Geo breakdown for this 2-way job shows only a single noisy spike (Germany = 100 for `ስብከት ኤርትራ`, the same low-confidence tiny-sample-size pattern flagged in Methodology) with every other country, Eritrea included, at 0 or no-data for both terms — too thin to read any real geo pattern from. **Net finding: as with every other vertical in this report, isolating "Eritrea" either by English qualifier or by adding it to a script query does not surface a cleaner teaching/sermon signal — it shrinks the already-thin volume further.**

No related-queries/related-topics data available for any term tested in this section (empty `rankedKeyword` list for every one checked, confirmed via direct inspection of the raw widget response) — consistent with every other term in this research.

### YouTube

**Orthodox — sermon/teaching content exists but is a minority sub-genre of existing mezmur-first channels, not a dedicated brand:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Anastasia ኣናስታስያ | 54.4K | 736 | runs a recurring, numbered **"ERITREAN ORTHODOX NEW SBKET [year]"** sermon/teaching series by named clergy (principally ቀሲስ ዕርዶም ዑቅባሚካኤል / Priest Erdom Uqbamikael, also ዲ/ን ሃብቶም ኣፈወርቂ and ቀሲስ ተስፋልደት ጠዓመ); very actively updated (newest entries 2 days, 2 weeks, and 1 month old at access time), individual sermon views 6K–40K — **but** the same channel's highest-view content and view-share is children's-choir **mezmur** (e.g. one hymn at 2.16M views, another at 2.54M views), so this is not a dedicated teaching channel |
| Medlote Amin መድሎተ ኣሚን | 104K (see §1) | 352 (see §1) | posts occasional "sbket" (sermon) content reaching 100K–250K views (e.g. "Lbka ms zdekm" 210,667 views; "ኣይትናወፁ" 189,311 views) as a minority alongside its dominant mezmur catalog (see §1) |
| Eritrean Orthodox Tewahdo ቤት ፍቕሪ እግዚኣብሄር | 130K (see §1) | ~1,096 | hosts Tigrinya-dubbed sermons of Pope Shenouda III (Coptic Orthodox, Egyptian) at very high view counts (592,916 and 1,531,211 views) — **high reach, but translated non-Eritrean-clergy content**, not Eritrean-produced teaching, and a minority of a catalog otherwise dominated by prayer/mezmur (see §1) |
| TewahdoTV Eritrean Orthodox Church | 20.4K | 2,312 | broad institutional broadcaster-style channel (announcements, youth-retreat highlights, occasional named Gospel-teaching segments e.g. "ወንጌል ጥዑም ዜና") but very low per-video reach (hundreds to low thousands of views despite the largest video count of any Orthodox channel found in this section) |
| HN St. Mary Eritrean Orthodox Tewahdo Church | 35.7K | 756 | parish channel; one-off teaching clips (e.g. "Fr Thomas Uwal - Teaching at St Mary Eritrean Orthodox Church in Chicago," 2,183 views) buried among general parish content |

**No clean single-source Orthodox teaching channel exists.** Anastasia is the closest thing to a consolidated, recurring, named-clergy sermon series, but it is not a dedicated teaching brand — its own catalog and audience draw is majority mezmur, the same content type already profiled in §1. Pointing a channel at it would inherit a mixed catalog, not a clean teaching-only feed.

**Catholic — fragmented across small channels organized by preacher, not by brand:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| catholicgheez | 10.8K | 1,388 | oldest Catholic channel found (joined 2009); carries the "Abba Teclezghi [Ucbaghiorghis]" sermon series (e.g. "Part 3"/"Part 4" of a London Gheez-Rite Chaplaincy sermon, 14,358–9,976 views, 17 years old) — same legacy-heavy, stale-catalog pattern §1 found for Catholic mezmur |
| Eritrean Catholic Charismatic Renewal | 5.47K (matches §1's 5.46K) | 1,616 | active live-streamer (streams 1–2 months old at access time) of charismatic-renewal prayer/teaching sessions (2–4 hours each), including named Scripture-teaching sessions (e.g. "ወንጌል ማቴዎስ" / Gospel of Matthew); views 2.9K–9.2K per stream — low per-video reach, same pattern §1 found for this channel's general content |
| ዓይኒ-ማይ: AyniMay Tube ("Fountainhead") | 19.5K | 898 | joined 2013; a standing devotional/teaching livestream channel (scripture reflection, rosary/prayer sessions) that also hosts some Abba Yonas Yohannes sermon content; the closest thing to a dedicated Catholic "teaching channel" brand found, but not seminar-exclusive (includes general prayer-service livestreams) and modest reach (1.4K–8.3K views/stream) |
| KidaneMhret Catholic Chaplaincy | 5.34K | 605 | livestreamed liturgy ("ስርዓተ ቅዳሴ") with very low views (1.3K–1.6K per stream) |
| E.H (legacy) | not pulled | — | 10–11-year-old uploads of "Eritrean catholic sebket Abba Yonas" sermons (named priest Abba Yonas Yohannes), 6.8K–34.7K views each |

A single named priest, **Abba Yonas Yohannes**, has sermon content recurring across at least three different channels (E.H, ዓይኒ-ማይ/AyniMay Tube, Eritrean Catholic Charismatic Renewal), and a second named priest, **Abba Teclezghi Ucbaghiorghis**, recurs on catholicgheez — but **no single channel consolidates either priest's content**, let alone the Catholic teaching genre generally. Supply is organized by preacher identity, fragmented across sub-20K-subscriber channels, the same overall "thin, legacy-heavy" shape §1 found for Catholic mezmur.

**Protestant/Evangelical — fragmented single-congregation channels, but with a real concentrated-demand signal in one specific preacher:**

| Channel | Subscribers | Videos | Notable |
|---|---|---|---|
| Gospel Light Baptist Eritrean Church Dallas | 8.05K (matches §1) | 1,019 | posts individual dated sermon videos (not full-service dumps) by name per pastor — Pastor Isaac Beraki, Pastor Biniam Asefaw, Reverend Temesgen Fessahaye — views mostly hundreds to low thousands, one outlier (Pastor Tesfatsion Hagos, "ሓይሊ ጸሎት") at 18,467 views |
| Ebenezer DC | 9.22K | 901 | individual sermon videos per pastor; a guest sermon by Pastor Goitom Gebreyonas (below) reaches 10,951–18,215 views, well above this channel's typical few-hundred-to-low-thousand range |
| Rehabot Church Stockholm | 6.55K | 498 | hosts several older Pastor Goitom Gebreyonas sermons at 104,125–170,092 views — far above this channel's otherwise modest reach |
| Mulue Wengel Stuttgart | 4.99K | 215 | hosts Pastor Goitom Gebreyonas sermons at 16,661–61,891 views |
| Ugbc Church Lancha / UGBC Church | 1.82K | 127 | small, newly-registered (2024) channel; still attracted 7,023–38,266 views on individual sermon/prayer videos |
| (various, not separately profiled) ABC Church Birmingham UK, PhxPhiladelphiaChurch, GOSPEL LIGHT CHURCH JUBA, Medhanialem church Gothenburg, UGBC AYAT | not pulled | — | each hosts at least one Pastor Goitom Gebreyonas sermon at 1,673–34,272 views |

**The standout finding for this denomination:** a single traveling preacher, **Pastor Goitom Gebreyonas**, draws dramatically higher per-video views (10K–170K) than the "hundreds to low thousands" §1 found to be typical for this denomination's single-congregation livestream content — but his sermons are **distributed across at least 8–10 different host-church channels that he does not own**, none of which carries only his content, and no dedicated "Pastor Goitom Gebreyonas" channel was found. This is structurally similar to the Biniam Girmay pattern in §5 (real demand concentrated in a name, not a channel) rather than the Kezahta pattern in §3 (demand concentrated in one owned channel) — except that unlike Girmay's content (mostly on international outlets NahomEriTV doesn't control), Gebreyonas's sermons are already scattered across many small Eritrean-diaspora church channels, none individually large enough to be a clean single-source pick.

### Sources (Church seminar/teaching)
- Trends API (5-way sermon/Bible-study compare), accessed 2026-11-03: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox%20sermon,Eritrean%20Catholic%20sermon,Eritrean%20Protestant%20sermon,Eritrean%20Evangelical%20sermon,Eritrean%20Bible%20study&hl=en-US`
- Trends API (4-way teaching/seminar compare), accessed 2026-11-03: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox%20teaching,Eritrean%20Catholic%20teaching,Eritrean%20Orthodox%20seminar,Eritrean%20Catholic%20seminar&hl=en-US`
- Trends API (standalone `Eritrean Orthodox sermon`, `Eritrean Catholic sermon`, `Eritrean Protestant sermon`, `Eritrean Evangelical sermon`, `Eritrean Bible study`, `Eritrean Orthodox teaching`, `Eritrean Catholic teaching`, `Eritrean Orthodox seminar`, `Eritrean Catholic seminar`), accessed 2026-11-03: `https://trends.google.com/trends/explore?date=today%205-y&q=Eritrean%20Orthodox%20sermon`, `...q=Eritrean%20Catholic%20sermon`, `...q=Eritrean%20Protestant%20sermon`, `...q=Eritrean%20Evangelical%20sermon`, `...q=Eritrean%20Bible%20study`, `...q=Eritrean%20Orthodox%20teaching`, `...q=Eritrean%20Catholic%20teaching`, `...q=Eritrean%20Orthodox%20seminar`, `...q=Eritrean%20Catholic%20seminar`
- Trends API (Tigrinya/Ge'ez-script 3-way compare `ትምህርተ ክርስቶስ`, `ስብከት`, `ትምህርተ መጽሓፍ ቅዱስ`), accessed 2026-11-03: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=%E1%89%B5%E1%88%9D%E1%88%85%E1%88%AD%E1%89%B0%20%E1%8A%AD%E1%88%AD%E1%88%B5%E1%89%B6%E1%88%B5,%E1%88%B5%E1%89%A5%E1%8A%A8%E1%89%B5,%E1%89%B5%E1%88%9D%E1%88%85%E1%88%AD%E1%89%B0%20%E1%88%98%E1%8C%BD%E1%88%93%E1%8D%8D%20%E1%89%85%E1%8B%B1%E1%88%B5&hl=en-US`
- Trends API (Eritrea-qualified script 2-way compare `ስብከት ኤርትራ`, `ትምህርተ ክርስቶስ ኤርትራ`), accessed 2026-11-03: human-facing equivalent `https://trends.google.com/trends/explore?date=today%205-y&q=%E1%88%B5%E1%89%A5%E1%8A%A8%E1%89%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB,%E1%89%B5%E1%88%9D%E1%88%85%E1%88%AD%E1%89%B0%20%E1%8A%AD%E1%88%AD%E1%88%B5%E1%89%B6%E1%88%B5%20%E1%8A%A4%E1%88%AD%E1%89%B5%E1%88%AB&hl=en-US`
- YouTube search, accessed 2026-11-03: `https://www.youtube.com/results?search_query=Eritrean+Orthodox+sermon`, `https://www.youtube.com/results?search_query=Eritrean+Orthodox+teaching`, `https://www.youtube.com/results?search_query=Eritrean+Orthodox+priest+teaching`, `https://www.youtube.com/results?search_query=%E1%89%80%E1%88%B2%E1%88%B5%20%E1%8B%95%E1%88%AD%E1%8B%B6%E1%88%9D%20%E1%8B%91%E1%89%85%E1%89%A3%E1%88%9A%E1%8A%AB%E1%8A%A4%E1%88%8D` (ቀሲስ ዕርዶም ዑቅባሚካኤል), `https://www.youtube.com/results?search_query=Eritrean+Catholic+sermon`, `https://www.youtube.com/results?search_query=Eritrean+Catholic+teaching`, `https://www.youtube.com/results?search_query=Eritrean+Catholic+homily`, `https://www.youtube.com/results?search_query=Eritrean+Evangelical+sermon`, `https://www.youtube.com/results?search_query=Eritrean+Protestant+sermon`, `https://www.youtube.com/results?search_query=Eritrean+pastor+teaching+Tigrinya`, `https://www.youtube.com/results?search_query=Pastor+Goitom+Gebreyonas`, `https://www.youtube.com/results?search_query=Living+Tewahdo+Eritrean+Orthodox`, `https://www.youtube.com/results?search_query=TewahdoTV+Eritrean+Orthodox`, `https://www.youtube.com/results?search_query=%E1%8B%93%E1%8B%AD%E1%8A%92-%E1%88%9B%E1%8B%AD%20AyniMay%20Tube`, `https://www.youtube.com/results?search_query=Ebenezer+DC+church`, `https://www.youtube.com/results?search_query=Rehabot+Church+Stockholm`, `https://www.youtube.com/results?search_query=Mulue+Wengel+Stuttgart`, `https://www.youtube.com/results?search_query=Ugbc+Church+Lancha`
- YouTube channel About pages, accessed 2026-11-03: `https://www.youtube.com/@anastasia6137/about`, `https://www.youtube.com/@TewahdoTV/about`, `https://www.youtube.com/@hnst.maryeritreanorthodoxt1629/about`, `https://www.youtube.com/@livingtewahdoeritreanortho933/about`, `https://www.youtube.com/@catholicgheez/about`, `https://www.youtube.com/@kidanemhretcatholicchaplai4275/about`, `https://www.youtube.com/@eritreancatholiccharismati7818/about`, `https://www.youtube.com/@fountainhead18/about`, `https://www.youtube.com/@ebenezerdc2385/about`, `https://www.youtube.com/@RehabotChurchStockholm/about`, `https://www.youtube.com/@muluewengelstuttgart6775/about`, `https://www.youtube.com/@UGBCCHURCH/about`, `https://www.youtube.com/@GospeLlightEritreanChurch/about` (Medlote Amin and Eritrean Orthodox Tewahdo ቤት ፍቕሪ እግዚኣብሄር figures reused from §1, same channel pages cited there)
