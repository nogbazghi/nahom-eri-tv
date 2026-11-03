import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveInitialLanguage, otherLanguage, translate } from "./i18n.js";
import { strings as englishStrings } from "./i18n/strings.en.js";
import { strings as tigrinyaStrings } from "./i18n/strings.ti.js";

test("translate: returns the value for a key present in the given dictionary", () => {
  const fixture = { greeting: "Welcome" };
  assert.equal(translate(fixture, "greeting"), "Welcome");
});

test("translate: falls back to the English value when a key is missing from the active-language dictionary", () => {
  const englishFixture = { farewell: "Goodbye" };
  const activeFixture = { greeting: "Welcome" }; // "farewell" missing here
  assert.equal(translate(activeFixture, "farewell", englishFixture), "Goodbye");
});

test("translate: a key present in the active dictionary wins over the fallback", () => {
  const englishFixture = { greeting: "Welcome" };
  const activeFixture = { greeting: "Selam" };
  assert.equal(translate(activeFixture, "greeting", englishFixture), "Selam");
});

// Key-parity test: imports the *real* strings.en.js and strings.ti.js (not
// fixtures — the point is catching an actual gap), per spec #22 / ticket
// #31's testing decisions. A missing translation should be caught here,
// not silently fall back to the wrong language in production.
test("strings.en.js and strings.ti.js export the exact same set of keys", () => {
  const englishKeys = Object.keys(englishStrings).sort();
  const tigrinyaKeys = Object.keys(tigrinyaStrings).sort();
  assert.deepEqual(tigrinyaKeys, englishKeys);
});

test("otherLanguage: English flips to Tigrinya", () => {
  assert.equal(otherLanguage("en"), "ti");
});

test("otherLanguage: Tigrinya flips to English", () => {
  assert.equal(otherLanguage("ti"), "en");
});

test("resolveInitialLanguage: null (nothing stored, first-time visitor) defaults to English", () => {
  assert.equal(resolveInitialLanguage(null), "en");
});

test("resolveInitialLanguage: undefined defaults to English", () => {
  assert.equal(resolveInitialLanguage(undefined), "en");
});

test("resolveInitialLanguage: stored \"en\" resolves to English", () => {
  assert.equal(resolveInitialLanguage("en"), "en");
});

test("resolveInitialLanguage: stored \"ti\" resolves to Tigrinya", () => {
  assert.equal(resolveInitialLanguage("ti"), "ti");
});

test("resolveInitialLanguage: an unrecognized stored value defaults to English", () => {
  assert.equal(resolveInitialLanguage("fr"), "en");
});
