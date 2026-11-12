// Wires the pure favorite decision logic (favorites.js) up to the DOM: reads/
// writes the persisted favorites list, and builds the per-row toggle button
// app.js's renderGuide() appends to each channel row. Kept separate from
// app.js and from favorites.js itself — all the side-effecting
// (localStorage/DOM) code lives here, so the decision logic stays pure and
// unit-testable. Untested glue, same role as i18n-ui.js/ios-install-hint-ui.js
// — verified by running the app.
import { toggleFavorite, isFavorite } from "./favorites.js";
import { t } from "./i18n-ui.js";

const STORAGE_KEY = "eriTvFavorites";

function readFavorites() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    // Private browsing / storage disabled, or a corrupt stored value: fail
    // safe to no favorites rather than throwing.
    return [];
  }
}

function persistFavorites(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Nothing more we can do if storage is unavailable; the toggle still
    // reflects the current state for this page view, it just won't be
    // remembered next visit.
  }
}

let favorites = readFavorites();

// Applies `channelName`'s current favorited state to its own toggle button —
// called right after building it, and again after every tap of it. A full
// guide re-render isn't needed for either case: favorite state doesn't yet
// affect row order/visibility (ticket #2, built on top of this one, owns
// that), so just this one button needs to reflect the new state.
function applyToggleState(button, channelName) {
  const favorited = isFavorite(favorites, channelName);
  button.setAttribute(
    "aria-label",
    favorited ? t("removeFromFavoritesAriaLabel") : t("addToFavoritesAriaLabel"),
  );
  button.setAttribute("aria-pressed", String(favorited));
  button.classList.toggle("is-favorited", favorited);
  button.textContent = favorited ? "★" : "☆";
}

// Builds one row's favorite-toggle button — app.js's renderGuide() appends
// this to each row's .guide-chan, available and unavailable rows alike.
export function createFavoriteToggle(channelName) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-toggle touch-target";
  applyToggleState(button, channelName);

  const toggle = (event) => {
    // Stop the click/keydown from bubbling to the row's own handlers, which
    // would otherwise also switch to this channel — the toggle must work
    // without tuning in.
    event.stopPropagation();
    favorites = toggleFavorite(favorites, channelName);
    persistFavorites(favorites);
    applyToggleState(button, channelName);
  };

  button.addEventListener("click", toggle);
  // Rows intercept Enter/Space (see app.js's guide-row keydown listener) to
  // drive guideNav instead of letting them bubble to a native click — this
  // button needs its own Enter/Space handling for the same reason, stopped
  // before it reaches that row listener.
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle(event);
    }
  });

  return button;
}
