---
status: accepted
---

# Apple TV and Roku are excluded from the TV Platform Apps effort

Spec #98 ships dedicated TV Platform Apps for Samsung Tizen, LG webOS, and
Fire TV, each a thin wrapper reusing the existing hosted web guide/player
nearly as-is, via YouTube's own iframe embed. Apple TV and Roku are
explicitly out of scope for that spec, for two different reasons:

- **Apple TV already has a working path**: a viewer can AirPlay-mirror the
  existing web app from a phone or Mac today. There's no unmet need a
  dedicated Apple TV app would solve that AirPlay doesn't already cover.
- **Roku has no general-purpose web rendering engine** a BrightScript app
  can embed — unlike Tizen/webOS/Fire TV, which all run a full WebView/web
  engine capable of hosting YouTube's iframe embed unchanged. Supporting
  Roku the same way the other three platforms are supported isn't
  possible; it would instead require self-hosting video directly, which is
  a different, larger undertaking this project doesn't have the rights
  posture for today (see ADR-0003/0004/0005 — the current content-rights
  model depends entirely on embedding YouTube's own officially-licensed
  player, not rehosting).

Both are revisited if either changes: Apple TV if AirPlay ever stops being
good enough, Roku if/when NahomEriTV has rights to self-host its own video.

See also ADR-0001, whose "TV-stick" input track this spec's three platforms
join — Apple TV and Roku are deliberately not listed there either.
