---
status: accepted
---

# The PWA service worker never caches schedule data, even for offline use

Adding PWA support (installability + an offline-capable app shell) means the service worker precaches `index.html`, `style.css`, `app.js`, `nav.js`, and the self-hosted fonts, so the shell loads instantly and even with no network. `data/videos.json` is deliberately excluded from that cache and stays strictly network-only — matching the `cache: "no-store"` fetch already in `app.js` — so offline shows an explicit "no connection" message rather than a stale schedule. The lineup is actively curated (videos added and removed, including same-day takedowns), so a cached copy could keep showing a pulled video or a stale channel lineup long after it stopped being true; that risk was judged worse than losing offline access to the guide itself. The alternative — caching a fallback copy of the schedule for offline viewing, like the rest of the shell — was rejected for this reason.
