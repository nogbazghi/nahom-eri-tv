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
A player control that re-tunes the current channel to its live broadcast position and resumes playback — the same outcome as reselecting the channel's row in the guide, offered as a one-tap shortcut from the player itself.
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
