// Regression guardrail (ADR-0011): an element's class setting `display`
// silently outranks the browser's default `[hidden] { display: none }`, so
// any element toggled via `.hidden = ` needs its own `[hidden]` CSS
// override or it never actually hides (shipped unnoticed for #cast-button
// on iOS — see that ADR for the full incident).
//
// This module finds every element *any* docs/*.js file toggles via
// `.hidden = `, by name — not a fixed list of the elements known to be
// affected today — so hidden-elements.test.js can assert the CSS
// invariant generically and catch the *next* occurrence automatically.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findHiddenToggledElementIds } from "./find-hidden-toggles.js";

test("finds an element bound via a direct const + getElementById", () => {
  const sources = [
    {
      filename: "a.js",
      source: `
        const castButton = document.getElementById("cast-button");
        castButton.hidden = false;
      `,
    },
  ];
  assert.deepEqual(findHiddenToggledElementIds(sources), ["cast-button"]);
});

test("finds an element bound as an object-literal property passed to another module", () => {
  // Mirrors cast-receiver.js's createReceiverChannelMenu({ menuToggle:
  // document.getElementById(...) }) / cast-receiver-menu.js's
  // `menuToggle.hidden = ...` — the binding name lives in a different file
  // than the `.hidden = ` assignment, connected only by the shared name.
  const sources = [
    {
      filename: "receiver.js",
      source: `createMenu({ menuToggle: document.getElementById("channel-menu-toggle") });`,
    },
    {
      filename: "menu.js",
      source: `function createMenu({ menuToggle }) { menuToggle.hidden = true; }`,
    },
  ];
  assert.deepEqual(findHiddenToggledElementIds(sources), ["channel-menu-toggle"]);
});

test("ignores elements that are fetched but never toggled via .hidden", () => {
  const sources = [
    {
      filename: "a.js",
      source: `
        const toolbarChan = document.getElementById("toolbar-chan");
        toolbarChan.textContent = "ERI";
      `,
    },
  ];
  assert.deepEqual(findHiddenToggledElementIds(sources), []);
});

test("de-duplicates an id toggled from more than one call site", () => {
  const sources = [
    {
      filename: "a.js",
      source: `
        const banner = document.getElementById("ios-install-hint");
        banner.hidden = false;
      `,
    },
    {
      filename: "b.js",
      source: `
        const banner = document.getElementById("ios-install-hint");
        banner.hidden = true;
      `,
    },
  ];
  assert.deepEqual(findHiddenToggledElementIds(sources), ["ios-install-hint"]);
});

test("returns ids sorted for a deterministic, readable result", () => {
  const sources = [
    {
      filename: "a.js",
      source: `
        const zebra = document.getElementById("zebra-view");
        zebra.hidden = true;
        const apple = document.getElementById("apple-view");
        apple.hidden = true;
      `,
    },
  ];
  assert.deepEqual(findHiddenToggledElementIds(sources), ["apple-view", "zebra-view"]);
});
