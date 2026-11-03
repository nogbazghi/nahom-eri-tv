---
status: accepted
---

# The Tigrinya language toggle's Ge'ez-script font is self-hosted and precached, not loaded from a CDN

The existing fonts (Big Shoulders Display, IBM Plex) are Latin-only subsets, so rendering Tigrinya chrome text needs a Ge'ez-script font (e.g. Noto Sans Ethiopic) added to the app. It's bundled as a self-hosted `.woff2` under `docs/fonts/` and added to the service worker's precache list, the same way the current fonts are shipped, rather than pulled from a font CDN at request time. The app shell is already precached end-to-end so it works with no network (ADR 0002 draws that same line for the rest of the shell); a CDN-loaded font would mean the language toggle silently stops working offline — the one case where "switch to Tigrinya" is most likely to matter to a diaspora viewer with unreliable connectivity. The CDN alternative was rejected for that reason, at the cost of a larger precached install size.
