# 015: Build the channel-switcher UI

**Status: done.**
**Depends on:** 013

## What was done

`docs/app.js` rewritten so channel list, current channel, playback math, and auto-advance all derive from `videos.json`'s `schedules` map — nothing hardcoded. Initial channel resolves from `?channel=` URL param → whichever channel has `default: true` → first channel in the data, in that order. Each channel computes its own "now" from its own `scheduleStart` against only its own filtered video subset. Switching channels updates the URL via `history.replaceState` (not `pushState`, so the back button isn't cluttered with every tab click) and re-renders the active tab.

`docs/index.html` adds `<nav id="channel-switcher">`. `docs/style.css` adds `.channel-tab`/`.active` styles reusing the existing dark-theme CSS variables.

## Verification

Tested twice: once against a throwaway fixture during development, then again (by me, after both curation and UI agents finished) against the real live `docs/data/videos.json` with both Weddings and Kebire populated — confirmed: default load lands on Weddings with `?channel=weddings` in the URL, clicking "Kebire" switches video/credit/URL/active-tab-style correctly, and loading `?channel=kebire` directly picks Kebire on first load. No console errors beyond the known-harmless YouTube ad-tracking CORS warning seen in earlier pilot testing too.

## Found during verification (not fixed, see ticket 017)

The header tagline still reads "Eritrean and Tigrinya weddings, playing now." — stale now that a second, non-wedding channel exists.

## Acceptance (met)

- Switcher works correctly against real multi-channel data, confirmed visually and via automated interaction testing.
