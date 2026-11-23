---
status: accepted
---

# A silent, universal first-gesture listener unlocks playback on Safari, instead of browser-detection or a visible stall UI

**Context:** On Safari/WebKit, muted autoplay of `app.js`'s cross-origin YouTube iframe is blocked by the platform itself — confirmed with a zero-app-code minimal repro (a bare `YT.Player` embed with the same `playerVars` stalls identically), so it isn't a regression in this repo's code, and nothing in `playerVars` alone can override it. A real user gesture (click/touch/keydown) followed by `player.playVideo()` was confirmed, by test, to unstick it.

**Decision:** Arm an unconditional `document`-level gesture listener (click/touchstart/keydown) on every page load, on every browser — not just Safari. On each gesture, if the player already exists, call `player.playVideo()` (a no-op if it's already `PLAYING`) and remove the listeners; if the player doesn't exist yet, leave the listeners attached so a later gesture can retry. No stall-detection timeout, no visible "tap to start" UI, and no Safari/WebKit user-agent sniffing.

A narrower design — record that *a* gesture happened, then have the player-ready callback itself call `playVideo()` once the player exists — was tried first and **confirmed by test not to work**: WebKit only honors the unlock when `playVideo()` is invoked synchronously inside a real, currently-firing gesture's own event handler, with the player already constructed at that moment. A gesture recorded earlier and acted on later from an unrelated async callback (e.g. `onPlayerReady`) does not count, even though the same single-gesture-then-immediate-call pattern reliably works. Hence the listener must stay attached across *multiple* gestures — not just the first one ever — until one of them lands after the player already exists.

**Considered Options:**
- *Visible stall-detection*: start a timeout after `onReady`, and only show a "tap to play" affordance if `PLAYING` hasn't fired within N seconds. Rejected — needs a timeout value, new UI/copy, and a new state to maintain, for a fix that's supposed to be invisible to begin with.
- *Safari-only, UA-sniffed listener*: only arm the gesture listener when the browser is detected as Safari/WebKit. Rejected — no benefit over the universal version (which is already a no-op everywhere the video is already playing), and UA-sniffing is itself a maintenance liability if Safari's behavior ever changes.
- *Remember-and-nudge-later* (gesture flag consulted from `onPlayerReady`): rejected after testing — confirmed empirically not to unstick WebKit, since the `playVideo()` call no longer runs inside a real gesture's own synchronous handler by the time it fires.

**Consequences:** On Chrome/Firefox this listener will, every time, find the player already `PLAYING` on first gesture and do nothing — it will look like dead code to a future reader. It is not: removing it silently reintroduces the Safari autoplay stall, which took a full diagnosis session (`/diagnosing-bugs`) to isolate the first time. Don't delete it without re-confirming the WebKit repro no longer needs it.
