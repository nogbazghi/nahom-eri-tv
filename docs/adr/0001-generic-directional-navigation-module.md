---
status: accepted
---

# Directional navigation is a generic module, not keyboard-specific logic

Keyboard navigation is the first of three planned input tracks for the guide/player UI — tablet next, then TV-stick/remote control after that. Real remotes ultimately deliver the same arrow-key-equivalent directional input to a web view that a keyboard does. Rather than wiring keyboard events directly to focus changes, focus-traversal is built as a generic "directional input moves focus through a list of focusable regions" module, with keyboard events as just one input source feeding it. The TV-stick track can then wire up a different input source against the same traversal logic instead of re-deriving navigation from scratch. The alternative — keyboard-specific logic now, generalized later — was rejected because the three tracks were scoped together specifically to share this.

**Note (see [ADR-0012](./0012-tv-platform-support-scoped-to-tizen-webos-firetv.md)):** this ADR originally named the TV-stick track's targets as "Chromecast, Apple TV, Fire TV, Roku," assuming all four deliver remote input to a web view. That assumption only holds for Chromecast, Fire TV, Android TV, Samsung Tizen, and LG webOS — Apple TV and Roku have no web view at all, and are out of scope for this module per ADR-0012.
