// Pure language lookup/toggle logic for the English/Tigrinya chrome-text
// toggle (ticket #31, part of spec #22). No DOM or browser-global access —
// mirrors offline-message.js/ios-install-hint.js — so this is both
// <script type="module">-loadable by the browser (via i18n-ui.js) and
// import-able directly by node --test (i18n.test.js).
import { strings as englishStrings } from "./i18n/strings.en.js";

const SUPPORTED_LANGUAGES = ["en", "ti"];

// Maps whatever's in localStorage to a supported language code. Anything
// unrecognized (null, missing, a stale/foreign value) resolves to "en" —
// first-time visitors, and visitors whose stored value somehow doesn't
// match a supported language, see English by default (user story #2).
export function resolveInitialLanguage(storedValue) {
  return SUPPORTED_LANGUAGES.includes(storedValue) ? storedValue : "en";
}

// Binary flip, used to compute the toggle button's own label (it's labeled
// with the language it would switch *to* — user story #5).
export function otherLanguage(lang) {
  return lang === "ti" ? "en" : "ti";
}

// Looks up `key` in whichever strings object is passed in; falls back to
// the English string (real strings.en.js by default, overridable for tests)
// if `key` is present in English but missing from the active language —
// defense-in-depth. The key-parity test below should make this unreachable
// in production: strings.en.js and strings.ti.js are asserted to export the
// exact same key set.
export function translate(strings, key, fallbackStrings = englishStrings) {
  if (strings && Object.prototype.hasOwnProperty.call(strings, key)) {
    return strings[key];
  }
  return fallbackStrings[key];
}
