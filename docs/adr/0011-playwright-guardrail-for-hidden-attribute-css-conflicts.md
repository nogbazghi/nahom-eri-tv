# Playwright guardrail for `hidden`-attribute/CSS conflicts

An element's class setting `display` silently outranks the browser's default `[hidden] { display: none }` (author styles beat the UA stylesheet regardless of specificity), so any element toggled via `.hidden` needs a restated `<selector>[hidden] { display: none }` rule or it never actually hides. This has shipped four times across `docs/` (`.install-hint`, `#receiver-message`, `#channel-menu-overlay`, `.btn-cast`) — three were caught and fixed by hand with an explanatory comment each time; `.btn-cast` wasn't, and reached production invisibly broken on iOS. We're adding a Playwright (Chromium) test that dynamically discovers every element any `docs/*.js` file sets `.hidden` on and asserts the real computed `display` toggles correctly in both directions, rather than a static CSS/HTML parser, because reimplementing cascade rules (origin, specificity, source order) by hand risks the exact class of subtlety that caused this bug in the first place.

## Considered Options

- **Static analysis script** (parse CSS + HTML + JS, no browser): rejected — would need to correctly reimplement CSS cascade precedence to be trustworthy, which is non-trivial and defeats the purpose of a guardrail against cascade mistakes.
- **WebKit instead of Chromium**: WebKit matches the real iOS incident, but the cascade behavior under test is CSS-spec, not engine-specific, and WebKit needs extra system packages to run on GitHub's `ubuntu-latest` runners. Chromium is cheaper and equally valid for this check.
- **Fixed regression list** (just the 4 known elements): rejected — the goal is catching the *next* occurrence automatically; a fixed list only re-tests history.
