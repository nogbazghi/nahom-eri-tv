"use strict";

// Service worker for the Nahom Eri TV app shell.
//
// Scope: precache the static shell (markup, styles, scripts, fonts,
// manifest, icons) and serve it cache-first with a network fallback, so the
// app loads instantly and still opens with no network at all once it has
// been visited once.
//
// Two things are deliberately NEVER touched by this service worker:
//   1. `data/videos.json` — the live, actively-curated broadcast schedule.
//      It is always passed straight to the network, matching the existing
//      `cache: "no-store"` fetch in app.js. See docs/adr/0002 for why a
//      stale cached copy would be actively harmful here.
//   2. Cross-origin requests (notably the YouTube IFrame API script) — these
//      pass straight through to the network, completely untouched, so video
//      playback is unaffected by the caching layer.
//
// Bump CACHE_NAME on any shell-asset change; the activate handler deletes
// every other cache name, so a new deploy's worker takes over (skipWaiting +
// clients.claim) and cleans up after itself silently on the next load, with
// no "update available" prompt.

const CACHE_NAME = "eri-tv-shell-v4";

const SHELL_ASSETS = [
  "./",
  "index.html",
  "about.html",
  "style.css",
  "app.js",
  "offline-message.js",
  "nav.js",
  "ios-install-hint.js",
  "ios-install-hint-ui.js",
  "manifest.webmanifest",
  "fonts/ibm-plex-sans-latin-400-normal.woff2",
  "fonts/ibm-plex-sans-latin-500-normal.woff2",
  "fonts/ibm-plex-sans-latin-600-normal.woff2",
  "fonts/ibm-plex-sans-latin-700-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
  "fonts/ibm-plex-mono-latin-600-normal.woff2",
  "fonts/big-shoulders-display-latin-700-normal.woff2",
  "fonts/big-shoulders-display-latin-800-normal.woff2",
  "fonts/big-shoulders-display-latin-900-normal.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/favicon-16.png",
];

const SCHEDULE_DATA_PATTERN = /\/data\/videos\.json$/;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(request.url);

  // Cross-origin requests (the YouTube IFrame API script, YouTube's own
  // player/embed traffic, etc.) are never intercepted or cached — let the
  // browser handle them exactly as it would with no service worker.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // The live broadcast schedule is never cached (ADR-0002): always network,
  // never masked by a stale cached copy.
  if (SCHEDULE_DATA_PATTERN.test(requestUrl.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  // Same-origin shell asset: cache-first, falling back to (and refreshing
  // from) the network.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (response && response.ok) {
          const responseCopy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, responseCopy));
        }
        return response;
      });
    }),
  );
});
