# LG webOS TV Platform App — packaging shell

(Ticket #100, part of spec #98.)

This directory is the *local* webOS app package — the thing you actually
`ares-package`/install. It's a **hosted** web app, not a packaged/offline
one: `index.html` here is a tiny dummy that immediately redirects to the
real, hosted entry page, `docs/webos.html` (deployed on the live site
alongside the main guide/player). That split exists because a
packaged/`file://`-origin app is confirmed to block YouTube's iframe embed
from loading at all — see the "Important Caveats" section a packaged app
would hit instead.

- `appinfo.json` — the webOS app manifest (`type: "web"`, `main:
  "index.html"`, required `icon`/`largeIcon`).
- `index.html` — the local dummy; redirects to
  `https://nogbazghi.github.io/nahom-eri-tv/webos.html`.
- `icon.png` (80×80), `largeIcon.png` (130×130) — generated from the site's
  existing `docs/icons/icon-512.png`.

The hosted entry page itself, the special-keys module it depends on, and
its wiring live one level up:

- `../webos.html` — the actual guide/player page this app runs, reusing
  `app.js`/`nav.js`/`style.css` unmodified; omits the Cast sender scripts
  and `#cast-button` (see its own comments, and
  `../browser-tests/cast-sender-omitted.test.js`).
- `../special-keys.js` / `../special-keys.test.js` — the shared, pure
  Back-key mapper this ticket introduces (webOS's keyCode 461, plus a
  first-cut Tizen keyCode 10009 mapping for ticket #99 to reuse rather than
  reintroduce).
- `../webos-keys-ui.js` — wires that mapper to real keydown events, closing
  the guide panel on Back by dispatching a synthetic Escape keydown that
  app.js's existing handler already understands.

## Building and installing

Using the [webOS TV CLI](https://webostv.developer.lge.com/develop/tools/cli-dev-guide):

```sh
# From this directory:
ares-package .                        # -> org.atleritrea.nahomeritv_1.0.0_all.ipk

ares-setup-device                     # once, to register the Simulator/TV as a target

ares-install -d <device> org.atleritrea.nahomeritv_1.0.0_all.ipk
ares-launch -d <device> org.atleritrea.nahomeritv
```

`<device>` is whatever name `ares-setup-device` gave the webOS TV Simulator,
or a real LG TV in Developer Mode (registered the same way, over the local
network). `ares-inspect` opens a Web Inspector against the running app for
debugging.

## Hand-verification note

The acceptance criteria for this ticket call for the app to actually be
installed and run on the webOS TV Simulator (and real hardware, if
available), with Favorites/Live events/language toggle/Go to Live/mute
checked by hand, plus observed answers for four flagged unknowns:

- Whether the hosted-app split above actually was necessary — i.e.
  confirming the packaged/`file://` YouTube-iframe block firsthand.
- D-pad vs. pointer-mode focus behavior on webOS's real web engine.
- Background/suspend playback behavior.
- Autoplay policy on webOS's Chromium build.

**This agent session has no webOS TV Simulator or hardware available, so
none of the above has actually been observed yet** — everything above is
implemented and covered by automated tests (`special-keys.test.js`,
`cast-sender-omitted.test.js`), but the TV-specific, non-automatable
verification this ticket's acceptance criteria require is still
outstanding. Before this ships: install the Simulator from the webOS TV
CLI/SDK, run through the steps above, and replace this paragraph with what
was actually observed for each of the four points (and the manual feature
checks), per the ticket.
