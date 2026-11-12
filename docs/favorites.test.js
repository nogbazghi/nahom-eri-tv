import { test } from "node:test";
import assert from "node:assert/strict";
import { isFavorite, toggleFavorite, visibleFavorites } from "./favorites.js";

test("isFavorite: true when the channel name is already in the favorites list", () => {
  assert.equal(isFavorite(["Kebire", "Zara"], "Kebire"), true);
});

test("isFavorite: false when the channel name is not in the favorites list", () => {
  assert.equal(isFavorite(["Kebire", "Zara"], "Habesha"), false);
});

test("toggleFavorite: adding a not-yet-favorited channel appends it", () => {
  assert.deepEqual(toggleFavorite(["Kebire"], "Zara"), ["Kebire", "Zara"]);
});

test("toggleFavorite: removing an already-favorited channel drops it", () => {
  assert.deepEqual(toggleFavorite(["Kebire", "Zara"], "Zara"), ["Kebire"]);
});

test("toggleFavorite: removing a name in the middle of the list leaves the rest in order", () => {
  assert.deepEqual(
    toggleFavorite(["Kebire", "Zara", "Habesha"], "Zara"),
    ["Kebire", "Habesha"],
  );
});

test("toggleFavorite: adding a name doesn't disturb the existing order", () => {
  assert.deepEqual(
    toggleFavorite(["Kebire", "Zara"], "Habesha"),
    ["Kebire", "Zara", "Habesha"],
  );
});

test("visibleFavorites: drops a stored name that no longer matches any current channel, preserving order of the rest", () => {
  assert.deepEqual(
    visibleFavorites(["Kebire", "Zara", "Habesha"], ["Habesha", "Kebire"]),
    ["Kebire", "Habesha"],
  );
});

test("visibleFavorites: returns an empty list when favorites is empty", () => {
  assert.deepEqual(visibleFavorites([], ["Kebire", "Zara"]), []);
});

test("visibleFavorites: returns an empty list when none of the stored favorites match any current channel", () => {
  assert.deepEqual(visibleFavorites(["Kebire"], []), []);
});
