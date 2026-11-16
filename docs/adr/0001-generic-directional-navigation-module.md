---
status: accepted
---

# Directional navigation is a generic module, not keyboard-specific logic

Keyboard navigation is the first of three planned input tracks for the guide/player UI — tablet next, then TV-stick/remote control after that. Real remotes ultimately deliver the same arrow-key-equivalent directional input to a web view that a keyboard does. Rather than wiring keyboard events directly to focus changes, focus-traversal is built as a generic "directional input moves focus through a list of focusable regions" module, with keyboard events as just one input source feeding it. The TV-stick track can then wire up a different input source against the same traversal logic instead of re-deriving navigation from scratch. The alternative — keyboard-specific logic now, generalized later — was rejected because the three tracks were scoped together specifically to share this.

The TV-stick track turned out to mean Chromecast (the Cast receiver's own D-pad-navigable channel menu, `docs/cast-receiver-menu.js`), then Samsung Tizen, LG webOS, and Fire TV (the TV Platform Apps, spec #98) — all four wire their remote's D-pad into this same module, unmodified. It does *not* cover Apple TV or Roku: see ADR-0012 for why those two are out of scope.
