// Translates each TV platform's own non-standard remote-control keys into
// the same KeyboardEvent.key vocabulary app.js's keydown handler already
// understands — today just "Escape" (closes an open guide panel). Standard
// D-pad arrows and Enter need no translation on any platform and are
// deliberately not handled here; app.js keeps handling those itself
// (ticket #99, part of spec #98).
//
// Pure: takes a raw KeyboardEvent.keyCode in, returns the translated key
// (or null when the keyCode isn't one of these platform specials) — no
// navigator/DOM access, in the style of ios-install-hint.js. Later webOS/
// Fire TV tickets add their own keyCode to SPECIAL_KEYS rather than
// recreating this module.
export const SPECIAL_KEYS = {
  10009: "Escape", // Tizen: the app's own registered "Back" key (ticket #99)
};

export function translateSpecialKey(keyCode) {
  return SPECIAL_KEYS[keyCode] ?? null;
}
