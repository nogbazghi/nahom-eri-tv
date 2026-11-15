import { test } from "node:test";
import assert from "node:assert/strict";
import { translateSpecialKey } from "./special-keys.js";

test("Tizen's registered Back key (keyCode 10009) translates to Escape, which app.js already closes the guide on", () => {
  assert.equal(translateSpecialKey(10009), "Escape");
});

test("standard arrow keys pass through untranslated", () => {
  assert.equal(translateSpecialKey(37), null); // ArrowLeft
  assert.equal(translateSpecialKey(38), null); // ArrowUp
  assert.equal(translateSpecialKey(39), null); // ArrowRight
  assert.equal(translateSpecialKey(40), null); // ArrowDown
});

test("standard Enter key passes through untranslated", () => {
  assert.equal(translateSpecialKey(13), null);
});
