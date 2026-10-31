# 017: Update the header tagline for multi-channel

**Depends on:** 015

## Context

`docs/index.html`'s `<p class="tagline">Eritrean and Tigrinya weddings, playing now.</p>` was written when Weddings was the only channel. It's misleading now that Kebire (travel/landscape content) also exists and is reachable via the switcher.

## Steps

1. Open `docs/index.html`, find the `.tagline` paragraph.
2. Replace it with something channel-agnostic, e.g. "Eritrean community TV, playing now." — or whatever phrasing fits once ticket 016 settles whether Kebire is actually live.

## Acceptance

- The tagline doesn't promise only wedding content once a second channel is live.
