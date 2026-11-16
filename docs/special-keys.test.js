import { test } from "node:test";
import assert from "node:assert/strict";
import { mapSpecialKey, DISMISS } from "./special-keys.js";

test("webOS Magic Remote Back button (keyCode 461) maps to DISMISS", () => {
  assert.equal(mapSpecialKey("webos", 461), DISMISS);
});

test("Tizen TV remote Back/Return key (keyCode 10009) maps to DISMISS", () => {
  assert.equal(mapSpecialKey("tizen", 10009), DISMISS);
});

test("standard arrow/Enter keyCodes pass through unchanged on webOS", () => {
  // 37-40: ArrowLeft/Up/Right/Down, 13: Enter — 5-way mode's own keys,
  // which app.js's existing keydown handler already understands and this
  // module explicitly leaves untranslated.
  for (const keyCode of [37, 38, 39, 40, 13]) {
    assert.equal(mapSpecialKey("webos", keyCode), null);
  }
});

test("standard arrow/Enter keyCodes pass through unchanged on Tizen", () => {
  for (const keyCode of [37, 38, 39, 40, 13]) {
    assert.equal(mapSpecialKey("tizen", keyCode), null);
  }
});

test("an unknown platform name passes every key through, including both platforms' Back keyCodes", () => {
  assert.equal(mapSpecialKey("firetv", 461), null);
  assert.equal(mapSpecialKey("firetv", 10009), null);
});

test("webOS's Back keyCode does not trigger DISMISS on Tizen", () => {
  assert.equal(mapSpecialKey("tizen", 461), null);
});

test("Tizen's Back keyCode does not trigger DISMISS on webOS", () => {
  assert.equal(mapSpecialKey("webos", 10009), null);
});
