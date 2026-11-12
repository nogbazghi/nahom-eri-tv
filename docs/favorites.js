// Pure favorite-channel decision logic (ticket #92, part of #89). No DOM or
// browser-global access — mirrors i18n.js/ios-install-hint.js — so this is
// both <script type="module">-loadable by the browser (via favorites-ui.js)
// and import-able directly by node --test (favorites.test.js).
//
// `favorites` is always an array of channel-name strings in stored order —
// the shape favorites-ui.js reads from/writes to localStorage.

export function isFavorite(favorites, channelName) {
  return favorites.includes(channelName);
}

// Toggles a single channel's favorited state, returning a new array rather
// than mutating — appends when not yet favorited, filters out when it is,
// leaving every other entry's relative order untouched either way.
export function toggleFavorite(favorites, channelName) {
  return isFavorite(favorites, channelName)
    ? favorites.filter((name) => name !== channelName)
    : [...favorites, channelName];
}

// Drops any stored favorite whose channel no longer exists (e.g. removed
// from the curated lineup), preserving the stored order of the ones that
// still do. Nothing calls this yet — ticket #2 will use it to filter the
// favorites section down to channels that still exist, built and tested
// now per ticket #92.
export function visibleFavorites(favorites, channelNames) {
  return favorites.filter((name) => channelNames.includes(name));
}
