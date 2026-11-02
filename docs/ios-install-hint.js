// Pure eligibility decision for the iOS "Add to Home Screen" install hint
// (ticket #10, part of issue #7). Deliberately takes already-resolved
// booleans rather than touching `navigator`/`matchMedia`/`localStorage`
// itself, so it's a plain, dependency-free input -> output function:
// trivially unit-testable (`node --test`) and safe to `import` from both the
// browser (as a `<script type="module">`) and the test runner.
export function shouldShowIosInstallHint({ isIOS, isStandalone, dismissed }) {
  return isIOS && !isStandalone && !dismissed;
}

// Detects iOS Safari from a UA string and touch-point count. Pure: takes
// values rather than reading `navigator` itself, so it stays unit-testable
// alongside shouldShowIosInstallHint. Covers iPadOS 13+, which masquerades
// as desktop Safari on "Macintosh" but — unlike a real Mac — reports
// multiple touch points.
export function detectIsIOS(userAgent, maxTouchPoints) {
  const ua = userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return /Macintosh/.test(ua) && Number(maxTouchPoints) > 1;
}

// True when the page is already running installed/standalone — either
// iOS Safari's legacy `navigator.standalone` flag or the standard
// `(display-mode: standalone)` media feature. Pure: takes the already-
// resolved booleans rather than calling `matchMedia` itself.
export function detectIsStandalone(navigatorStandalone, matchesStandaloneDisplayMode) {
  return Boolean(navigatorStandalone) || Boolean(matchesStandaloneDisplayMode);
}
