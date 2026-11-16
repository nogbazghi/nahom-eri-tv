// Wires the shared special-keys module up to real keydown events on LG
// webOS (ticket #100, part of spec #98): when the Magic Remote's Back
// button fires, dispatches a synthetic "Escape" keydown on `document` so
// app.js's existing keydown handler closes the guide panel exactly as the
// real Escape key already does — app.js itself needs no platform branching
// and stays completely unaware a TV remote exists (same reuse this spec's
// Implementation Decisions call for on nav.js/the keydown handler).
//
// Standard 5-way mode arrows/Enter already arrive as ordinary KeyboardEvents
// with the `key` values app.js's handler expects, so this file only ever
// has to act on the one non-standard key.
import { mapSpecialKey, DISMISS } from "./special-keys.js";

document.addEventListener("keydown", (event) => {
  if (mapSpecialKey("webos", event.keyCode) !== DISMISS) return;
  event.preventDefault();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
});
