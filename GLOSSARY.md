# Nahom Eri TV

A broadcast-style streaming channel for Eritrean/Tigrinya diaspora content, played through the guide/player UI.

## Language

**Channel row**:
The focusable/selectable unit in the guide — one channel's entire now/next lineup, treated as a single target. Selecting it (by any of its cells) tunes to that channel's live broadcast position; the individual now/+2min/+9min cells within it are informational, not independently selectable. A row for a channel with nothing scheduled is disabled rather than selectable, and excluded from keyboard/focus navigation.
_Avoid_: Guide cell, grid cell (as a selectable unit — a cell is just a visual slot inside a row, not a thing you can select on its own)

**Focus**:
The single Channel/Live event row a keyboard or TV-stick-remote user is currently on, tracked and moved by `guideNav` (`nav.js`, see [ADR-0001](./docs/adr/0001-generic-directional-navigation-module.md)) one row at a time via directional input. Focus is a keyboard/remote-only concept — touch has no equivalent "currently focused" row and never feeds `guideNav`; a touch viewer selects a row by tapping it directly, the same way a mouse click does (see [ADR-0017](./docs/adr/0017-touch-scrolls-and-taps-the-guide-directly.md)).
_Avoid_: Selection (ambiguous with the tap/click/Enter action that activates a row, as opposed to merely landing on it), Highlight (names the visual affordance, not the navigation concept)

**Live broadcast position**:
The point in a channel's cyclic lineup that corresponds to right now, computed from wall-clock time against the channel's fixed schedule start. Not a stream buffer edge — channels aren't true live streams, so there's nothing to fall behind except this computed position.
_Avoid_: Live edge (implies a real-time stream buffer, which doesn't exist here), live position

**Go to Live**:
A player control that jumps back to "what's happening right now" and resumes playback, offered as a one-tap shortcut from the player itself. For a channel, that means re-tuning to its computed live broadcast position (the same outcome as reselecting the channel's row in the guide). For a Live event, it means an actual live-edge jump on the real stream, since there a viewer genuinely can fall behind. Same control and label in both contexts; the mechanism underneath differs by what's playing.
_Avoid_: Live button (ambiguous with a stream's live edge)

**Language toggle**:
A two-state header control, next to About, that switches the app's chrome text between English and Tigrinya; the choice persists across visits and defaults to English.
_Avoid_: Language switcher, translation button

**Chrome text**:
Static UI text owned by the app shell — labels, buttons, status messages — as opposed to content text sourced from channel/video data. Only chrome text is translated by the language toggle.
_Avoid_: UI text, labels (when the static/dynamic distinction matters)

**Content text**:
Text sourced from channel or video data (titles, channel names) rather than written by the app itself. Not translated by the language toggle — it already carries whatever language its source used.
_Avoid_: Dynamic text, data text

**Live event**:
A single scheduled occasion (e.g. a wedding or festival) whose organizer is live-streaming it on their own YouTube channel, which Nahom Eri TV features for the occasion by adding a temporary row to the guide pointing at that live video.
_Avoid_: Live channel (a Live event has no `channels.yaml` entry and no cyclic lineup — it's a different mechanism from a Channel row, not a special case of one)

**Live event row**:
The temporary guide entry for a Live event — added by a reviewed PR naming a source video and scheduled start time, visible some lead time before that start, and removed automatically a fixed window afterward. Unlike a Channel row, it points directly at one real live stream rather than computing a position in a cyclic lineup.
_Avoid_: Channel row (when specifically distinguishing the two)

**Cast**:
A viewer sending the channel to a Chromecast or Android TV device running Nahom Eri TV's own registered receiver app, after which the TV's remote drives channel switching directly. Only available where the Cast SDK exists (Chrome/Android); the Cast button stays hidden everywhere else, including Safari.
_Avoid_: Casting (ambiguous with AirPlay), Chromecast (names one brand of receiving device, not the viewer action)

**AirPlay**:
A viewer's own device/browser feature for sending the player's video and audio to an AirPlay-capable receiver (an Apple TV, or a smart TV/soundbar with AirPlay 2 built in) — offered entirely by the browser's native video controls. Nahom Eri TV has no sender code or receiver app of its own for it, unlike Cast, and it cannot reach a Chromecast or Android TV device (they don't speak AirPlay).
_Avoid_: Casting (ambiguous with Cast), Airplay-casting

**TV Platform App**:
A dedicated, store-distributed packaging of the existing web guide/player for a smart-TV platform whose own web engine can host it (Samsung Tizen, LG webOS, Fire TV) — the viewer installs and launches it directly on the TV, remote-driven, rather than reaching Nahom Eri TV via Cast or AirPlay from another device. See [ADR-0012](./docs/adr/0012-tv-platform-support-scoped-to-tizen-webos-firetv.md) for which platforms qualify and why Apple TV and Roku don't.
_Avoid_: Native app (implies a rebuild; these reuse the existing web codebase as-is), Smart TV app (ambiguous with a TV's own built-in apps)

**Favorite**:
A viewer's own marking of a Channel for quick return, kept only in that browser/device's storage (nothing is synced or shared). Favoriting doesn't reorganize the guide — it only pins the channel into its own section for faster access. Applies to Channel rows only; a Live event row is too short-lived to be worth favoriting.
_Avoid_: Bookmark (already used elsewhere for the channel-in-URL shareability behavior, a different concept), Pin, Star (these name the UI affordance, not the concept)

**Favorites section**:
The guide section listing a viewer's Favorites, positioned below Live event rows but above the full channel list. Hidden entirely until the viewer has favorited at least one channel; a favorited channel still appears in its normal place in the full list as well.
_Avoid_: Favorites row (it's a section that can hold several rows, not a single row)

### Viewership

**Viewership count**:
A Channel's weekly tally of real watches, counted anonymously with no per-viewer or per-session identifier — one per sustained playback of that channel, not per row selection. Used only to prioritize curation effort; never shown to viewers. See [ADR-0014](./docs/adr/0014-first-party-anonymous-viewership-counting-for-curation.md).
_Avoid_: View count (ambiguous with YouTube's own per-video metric, which counts plays anywhere a video is embedded, not just inside this app), Analytics (implies broader tracking than this narrow signal)

**Viewership snapshot**:
The weekly git-committed file recording each Channel's Viewership count for that week, written alongside the existing curation run rather than served as part of the live site or shown on any dashboard.
_Avoid_: Analytics dashboard (there isn't one — the committed file is read directly)

## Curation review

**Addition**:
A newly discovered video that passed a channel rule's validation and was proposed to join that channel's lineup — `curation/ARCHITECTURE.md`'s pipeline-level term for the record, stored as `additions` in a channel's `.pending/<channel>.json` summary. Once an Addition is in the Curation review dashboard being individually decided on, call it a Curation candidate instead.
_Avoid_: New video, discovered video

**Curation run**:
The additions and removals bundled into the standing branch's currently open review Pull Request, produced by one execution of the scheduled curation pipeline. The dashboard only ever has one Curation run to show at a time — a pipeline execution that finds a review already in progress skips updating the branch rather than queuing a second one.
_Avoid_: Job run (`curation/ARCHITECTURE.md`'s term for the underlying scheduled pipeline execution itself — a run only becomes a Curation run if it actually opens or updates the PR)

**Curation candidate**:
An Addition while it belongs to the currently open Curation run, awaiting (or already carrying) a Review decision. Use this term, not Addition, whenever the review flow is the context.
_Avoid_: Addition (within the review flow — see Addition)

**Review decision**:
The reviewer's recorded disposition for one Curation candidate: Approved, or Rejected with a required reason. A candidate with no Review decision yet is undecided; a decision can be undone, reverting the candidate to undecided, any time before its Curation run is finished.
_Avoid_: Verdict, judgment

**Curation review dashboard**:
The page on the existing GitHub Pages site where the owner reviews one Curation run, recording a Review decision on each Curation candidate individually before finishing — which merges the PR and is the only action that publishes approved additions to `main`.
_Avoid_: Review tool, admin panel
