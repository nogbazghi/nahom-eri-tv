// Wires the pure language-toggle decision logic (i18n.js) up to the DOM:
// reads/writes the persisted language choice, applies it to static markup,
// updates <html lang>, renders the header toggle button's own label, and
// lets app.js (which owns dynamic chrome text like the guide-toggle/unmute
// button/guide cells) re-render whenever the language changes. Kept
// separate from app.js and from i18n.js itself — all the side-effecting
// (localStorage/DOM) code lives here, so the decision logic stays pure and
// unit-testable. Untested glue, same role as ios-install-hint-ui.js/nav.js
// — verified by running the app (ticket #31's testing decisions).
import { translate, otherLanguage, resolveInitialLanguage } from "./i18n.js";
import { strings as englishStrings } from "./i18n/strings.en.js";
import { strings as tigrinyaStrings } from "./i18n/strings.ti.js";

const STORAGE_KEY = "eriTvLanguage";

// The toggle button's own label is always the *name* of the language it
// switches to, written in that language — not looked up via translate()
// against the currently active strings dict (user story #5: "ትግርኛ" shows
// while in English, "English" shows while in Tigrinya, regardless of which
// chrome strings are active).
const LANGUAGE_DISPLAY_NAMES = { en: "English", ti: "ትግርኛ" };

const STRINGS_BY_LANGUAGE = { en: englishStrings, ti: tigrinyaStrings };

function readStoredLanguage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled: fail safe to the default
    // (English) rather than throwing.
    return null;
  }
}

function persistLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Nothing more we can do if storage is unavailable; the chosen
    // language still applies for the current page view, it just won't be
    // remembered next visit.
  }
}

let currentLanguage = resolveInitialLanguage(readStoredLanguage());
const languageChangeListeners = [];

// Convenience shorthand for the currently active language's strings —
// what app.js's own textContent assignments should read from instead of
// hardcoded literals.
export function t(key) {
  return translate(STRINGS_BY_LANGUAGE[currentLanguage], key);
}

export function getCurrentLanguage() {
  return currentLanguage;
}

// Lets other modules (app.js) re-render whatever chrome text they own
// whenever the active language changes, including state-dependent text
// (e.g. the guide-toggle/unmute button's current open/closed, muted state)
// that static data-i18n tagging alone can't express.
export function onLanguageChange(callback) {
  languageChangeListeners.push(callback);
}

// Applies the active language to every statically-tagged element in the
// current document:
//   - [data-i18n]: plain textContent.
//   - [data-i18n-html]: innerHTML — only ever set from this app's own
//     trusted, developer-authored strings (see strings.en.js/strings.ti.js),
//     never from visitor input.
//   - [data-i18n-aria-label]: the aria-label attribute.
function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  });
}

function updateToggleButtonLabel(button) {
  if (!button) return;
  button.textContent = LANGUAGE_DISPLAY_NAMES[otherLanguage(currentLanguage)];
}

function applyLanguage(toggleButton) {
  document.documentElement.lang = currentLanguage;
  applyStaticTranslations();
  updateToggleButtonLabel(toggleButton);
  languageChangeListeners.forEach((callback) => callback(currentLanguage));
}

const toggleButton = document.getElementById("lang-toggle");

if (toggleButton) {
  toggleButton.addEventListener("click", () => {
    currentLanguage = otherLanguage(currentLanguage);
    persistLanguage(currentLanguage);
    applyLanguage(toggleButton);
  });
}

applyLanguage(toggleButton);
