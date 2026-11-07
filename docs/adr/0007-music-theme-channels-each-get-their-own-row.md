---
status: accepted
---

# Music theme channels each get their own schedule row, not a shared one like Sports/Sports_diaspora

Sports and Sports_diaspora are two separate curation rules in `channels.yaml` that feed one shared schedule/channel row — they're both just "cycling/athletics content," merely from different source pools, so blending them costs nothing. The new Music theme channels (Liberation Era, Post-Independence Classics, Modern, Diaspora Artists, Independence Day) do the opposite: each theme gets its own fully separate channel row and schedule entry. This is deliberate, not an oversight — unlike Sports' two rules, these themes are meaningfully different listening experiences (decade nostalgia vs. diaspora pride vs. an annual occasion), and a viewer tuning in for Independence Day music shouldn't have to sit through a Liberation Era track to get there. The guide's flat, scrollable row list (no grouping/section feature) made this cheap: five more rows is a non-issue for that layout, so there was no UX pressure to consolidate the way there might be with a fixed-width tab bar.

## Considered Options

A single shared "Music" row blending all themed content into one loop (mirroring Sports/Sports_diaspora) was the alternative — rejected because mixing eras/occasions in one loop undermines the entire point of offering themed lineups in the first place.
