import { test } from "node:test";
import assert from "node:assert/strict";
import { filterFocusable, focusDescendant, focusAncestor } from "./nav.js";

test("filterFocusable: keeps a plain enabled, visible element", () => {
  const el = { hidden: false, disabled: false };
  assert.deepEqual(filterFocusable([el]), [el]);
});

test("filterFocusable: drops a hidden element", () => {
  const visible = { hidden: false, disabled: false };
  const hidden = { hidden: true, disabled: false };
  assert.deepEqual(filterFocusable([visible, hidden]), [visible]);
});

test("filterFocusable: drops a disabled element", () => {
  const enabled = { hidden: false, disabled: false };
  const disabled = { hidden: false, disabled: true };
  assert.deepEqual(filterFocusable([enabled, disabled]), [enabled]);
});

test("filterFocusable: drops null/undefined entries (an optional control that isn't on this page)", () => {
  const el = { hidden: false, disabled: false };
  assert.deepEqual(filterFocusable([null, el, undefined]), [el]);
});

test("focusDescendant: focuses a matching descendant and reports true", () => {
  let focused = false;
  const star = { focus: () => (focused = true) };
  const row = { querySelector: (sel) => (sel === ".favorite-toggle" ? star : null) };
  assert.equal(focusDescendant(row, ".favorite-toggle"), true);
  assert.equal(focused, true);
});

test("focusDescendant: reports false and focuses nothing when there's no match (e.g. a Live event row, which has no favorite toggle)", () => {
  const row = { querySelector: () => null };
  assert.equal(focusDescendant(row, ".favorite-toggle"), false);
});

test("focusDescendant: reports false for a null container rather than throwing", () => {
  assert.equal(focusDescendant(null, ".favorite-toggle"), false);
});

test("focusAncestor: focuses the closest matching ancestor and reports true", () => {
  let focused = false;
  const row = { focus: () => (focused = true) };
  const star = { closest: (sel) => (sel === ".guide-row" ? row : null) };
  assert.equal(focusAncestor(star, ".guide-row"), true);
  assert.equal(focused, true);
});

test("focusAncestor: reports false when there's no matching ancestor", () => {
  const el = { closest: () => null };
  assert.equal(focusAncestor(el, ".guide-row"), false);
});
