// Wires the pure iOS install-hint decision (ios-install-hint.js) up to the
// DOM: reads the three real-world signals (platform, standalone mode,
// prior dismissal), shows/hides the #ios-install-hint banner accordingly,
// and persists a dismissal to localStorage so the hint never reappears on
// this device. Kept separate from app.js and from ios-install-hint.js
// itself — all the side-effecting (navigator/localStorage/DOM) code lives
// here, so the decision logic stays pure and unit-testable.
import { shouldShowIosInstallHint, detectIsIOS, detectIsStandalone } from "./ios-install-hint.js";

const DISMISSED_KEY = "eriTvIosInstallHintDismissed";

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "true";
  } catch {
    // Private browsing / storage disabled: fail safe by never persisting,
    // which just means the hint may reappear next visit — not shown twice
    // in the same session's DOM either way.
    return false;
  }
}

function persistDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "true");
  } catch {
    // Nothing more we can do if storage is unavailable; the banner still
    // hides for the current page view.
  }
}

const banner = document.getElementById("ios-install-hint");
const dismissButton = document.getElementById("ios-install-hint-dismiss");

if (banner && dismissButton) {
  const isIOS = detectIsIOS(navigator.userAgent, navigator.maxTouchPoints);
  const isStandalone = detectIsStandalone(
    navigator.standalone,
    window.matchMedia && window.matchMedia("(display-mode: standalone)").matches,
  );
  const dismissed = readDismissed();

  if (shouldShowIosInstallHint({ isIOS, isStandalone, dismissed })) {
    banner.hidden = false;
  }

  dismissButton.addEventListener("click", () => {
    banner.hidden = true;
    persistDismissed();
  });
}
