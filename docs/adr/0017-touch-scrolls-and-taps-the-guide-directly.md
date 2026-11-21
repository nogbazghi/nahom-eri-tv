---
status: accepted
---

# Touch is excluded from ADR-0001's directional-navigation module; it scrolls and taps the guide panel directly

ADR-0001 scoped directional-input tracks together — keyboard first, then tablet, then TV-stick/remote — specifically so they could share one generic "directional input moves Focus through a list of focusable regions" module (`nav.js`'s `guideNav`). Touch was wired in as a second input source feeding that same module: a vertical swipe moved Focus one `.guide-row` at a time (discrete paging, not free scroll) and a horizontal swipe activated the focused row, alongside each row's own tap/click handler. At the channel counts that existed when that was written this was unnoticeable; with `curation/channels.yaml` now at roughly 25 entries it made the guide's full channel list nearly impossible to reach by swipe, since a vertical swipe no longer did what every other mobile list does — scroll — and instead intercepted the gesture to move Focus a single row at a time.

Touch is removed from `guideNav` entirely rather than patched (e.g. only suppressing the discrete-paging behavior while keeping some other swipe-driven interaction). A touch viewer never has a "currently focused" row the way a keyboard or remote user does (see `GLOSSARY.md`'s **Focus** entry) — touch selects by tapping a row directly, the same `click` handler `switchChannel()`/`guideNav.activate()` already use for mouse input, and scrolls by the browser's own native vertical scroll over the guide panel now that nothing calls `preventDefault()` on it. Keyboard and TV-stick-remote input are untouched by this change — both keep moving Focus one row at a time through `guideNav.move()`/`guideNav.activate()`, per ADR-0001.

Two alternatives were considered and rejected:

- **Gate the discrete-paging swipe behind a channel-count threshold** (e.g. fall back to native scroll only once the list exceeds some length). Rejected because it reintroduces exactly the kind of "not a concern yet, revisit if it grows" caveat that caused this bug in the first place — the fix should hold regardless of how large the channel list gets, not need revisiting at the next threshold.
- **Give the guide panel its own capped-height scrollable sub-box, with the player pinned above it.** Rejected for now: there's no existing scroll container to build on, and a fixed-height sub-box is fragile against real mobile viewport-height quirks (address-bar collapse/expand, on-screen keyboard, safe-area insets) that the page's own native scroll doesn't have to account for. Revisit only if losing sight of the player while scrolling the guide becomes an actual complaint — not preemptively.
