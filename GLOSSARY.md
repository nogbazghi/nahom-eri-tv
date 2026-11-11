# Nahom Eri TV

A broadcast-style streaming channel for Eritrean/Tigrinya diaspora content, played through the guide/player UI.

## Language

**Channel row**:
The focusable/selectable unit in the guide — one channel's entire now/next lineup, treated as a single target. Selecting it (by any of its cells) tunes to that channel's live broadcast position; the individual now/+2min/+9min cells within it are informational, not independently selectable. A row for a channel with nothing scheduled is disabled rather than selectable, and excluded from keyboard/focus navigation.
_Avoid_: Guide cell, grid cell (as a selectable unit — a cell is just a visual slot inside a row, not a thing you can select on its own)

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

**Favorite**:
A viewer's own marking of a Channel for quick return, kept only in that browser/device's storage (nothing is synced or shared). Favoriting doesn't reorganize the guide — it only pins the channel into its own section for faster access. Applies to Channel rows only; a Live event row is too short-lived to be worth favoriting.
_Avoid_: Bookmark (already used elsewhere for the channel-in-URL shareability behavior, a different concept), Pin, Star (these name the UI affordance, not the concept)
