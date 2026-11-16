// Translates each TV platform's own non-standard remote keys into the
// vocabulary app.js's existing `keydown` handler already understands.
// Standard D-pad arrows and Enter arrive as ordinary KeyboardEvents with
// the usual `event.key` values on every platform this module knows about
// (confirmed by each platform's own remote-control reference) and need no
// translation here — this module's only job is each platform's Back
// button, which arrives as a non-standard numeric `keyCode` rather than a
// `key` the handler recognizes.
//
// Pure, dependency-free (same shape as ios-install-hint.js): takes an
// already-resolved keyCode, returns the mapped action or null. Doesn't
// touch `document`/`navigator` itself — a thin per-platform `*-ui.js` file
// does that wiring, the same split ios-install-hint.js/-ui.js uses (ticket
// #99/#100, part of spec #98).

export const DISMISS = "dismiss";

// Each platform's registered/non-standard Back keyCode, confirmed against
// that platform's own remote-control reference rather than guessed:
// - webOS: the Magic Remote's Back button sends keyCode 461 (LG webOS TV
//   developer guide, Magic Remote reference) — ticket #100.
// - Tizen: the TV remote's Back/Return key sends keyCode 10009, and is a
//   mandatory key delivered without registerKeyBatch() (Samsung Tizen TV
//   remote-control reference) — landed here as the first cut for ticket
//   #99 to reuse rather than reintroduce.
const BACK_KEYCODE_BY_PLATFORM = {
  webos: 461,
  tizen: 10009,
};

// `platform` is one of BACK_KEYCODE_BY_PLATFORM's own keys; an unknown
// platform name simply never matches, so every key on it passes through.
export function mapSpecialKey(platform, keyCode) {
  return BACK_KEYCODE_BY_PLATFORM[platform] === keyCode ? DISMISS : null;
}
