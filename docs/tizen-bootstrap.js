// Registers the TV remote's Back key with the Tizen platform — an
// unregistered key is swallowed before it ever reaches the page as a
// keydown (ticket #99, part of spec #98). Once registered, app.js's
// keydown handler sees it like any other key and special-keys.js
// translates its keyCode into the dismiss action.
//
// Guarded on the `tizen` global existing at all: this script is only ever
// loaded from tizen-entry.html, but that page is also loaded directly in a
// regular browser (the Playwright guardrail in browser-tests/, and anyone
// previewing the entry page outside the packaged app), where no such global
// exists.
if (typeof tizen !== "undefined" && tizen.tvinputdevice) {
  tizen.tvinputdevice.registerKey("Back");
}
