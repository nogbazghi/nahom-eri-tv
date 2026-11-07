// Generic directional-focus navigation over a list of DOM elements, decoupled
// from any particular input device. Keyboard is the first caller (see the
// keydown handling in app.js); the planned tablet and TV-stick tracks are
// meant to feed the same move()/activate() calls from whatever input events
// those platforms deliver, rather than re-deriving navigation from scratch.
// See docs/adr/0001-generic-directional-navigation-module.md.
//
// This module knows nothing about channels, guides, or keyboards — just "a
// list of focusable elements, move by delta, activate whichever one has
// focus." It manages focus directly (a fully-scripted roving focus) rather
// than juggling tabindex values on every item.

export function createListNav({ getItems, onActivate }) {
  let focusedIndex = -1;

  function clamp(index, length) {
    return Math.max(0, Math.min(index, length - 1));
  }

  // Not exposed — nothing outside this module needs to jump to an arbitrary
  // index. External callers move relatively (move) or by lookup (focusWhere).
  function setFocus(index) {
    const items = getItems();
    if (items.length === 0) {
      focusedIndex = -1;
      return;
    }
    focusedIndex = clamp(index, items.length);
    items[focusedIndex].focus();
  }

  // Focuses the first item matching `predicate`, or item 0 if none match.
  function focusWhere(predicate) {
    const items = getItems();
    const index = items.findIndex(predicate);
    setFocus(index === -1 ? 0 : index);
  }

  function move(delta) {
    if (focusedIndex === -1) {
      setFocus(0);
      return;
    }
    setFocus(focusedIndex + delta);
  }

  function activate() {
    const items = getItems();
    const item = items[focusedIndex];
    if (item && onActivate) onActivate(item, focusedIndex);
  }

  // Called when the list is hidden/torn down, so a later open() starts fresh
  // rather than remembering a stale index from a differently-ordered list.
  function reset() {
    focusedIndex = -1;
  }

  return { focusWhere, move, activate, reset };
}
