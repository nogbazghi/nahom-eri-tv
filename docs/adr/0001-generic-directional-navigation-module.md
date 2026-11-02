---
status: accepted
---

# Directional navigation is a generic module, not keyboard-specific logic

Keyboard navigation is the first of three planned input tracks for the guide/player UI — tablet next, then TV-stick/remote control (Chromecast, Apple TV, Fire TV, Roku) after that. Real remotes ultimately deliver the same arrow-key-equivalent directional input to a web view that a keyboard does. Rather than wiring keyboard events directly to focus changes, focus-traversal is built as a generic "directional input moves focus through a list of focusable regions" module, with keyboard events as just one input source feeding it. The TV-stick track can then wire up a different input source against the same traversal logic instead of re-deriving navigation from scratch. The alternative — keyboard-specific logic now, generalized later — was rejected because the three tracks were scoped together specifically to share this.
