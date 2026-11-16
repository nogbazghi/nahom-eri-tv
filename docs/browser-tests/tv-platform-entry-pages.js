// The hosted entry pages for each TV Platform App (spec #98) — pages that
// must never load the Cast sender or show #cast-button, since the TV
// itself is already the Cast destination. A platform's own ticket adds its
// filename here when its entry page lands, rather than each one
// reimplementing the guardrail in cast-sender-omitted.test.js from scratch.
export const TV_PLATFORM_ENTRY_PAGES = [
  "webos.html", // ticket #100
];
