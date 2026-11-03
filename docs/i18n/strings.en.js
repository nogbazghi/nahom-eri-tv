// English chrome-text strings for the language toggle (ticket #31, part of
// spec #22). Pure data — a complete, linearly-readable copy deck. Keys here
// must exactly match docs/i18n/strings.ti.js's keys (see the key-parity test
// in docs/i18n.test.js); this file is also translate()'s English fallback
// source when a key is missing from the active language.
//
// Scope: index.html's chrome text only (guide/player page, ticket #31).
// about.html's prose is ticket #32's job — new keys land here when that
// ticket starts, not before.
export const strings = {
  // #guide-toggle (docs/app.js openGuide()/closeGuide()) — also the
  // button's static initial text in index.html.
  guideToggleOpenLabel: "Guide ▾",
  guideToggleCloseLabel: "Close ✕",

  // Guide panel cells (docs/app.js renderGuide()).
  nowLabel: "NOW",
  nothingScheduledLabel: "Nothing scheduled",

  // Corner badge empty state (docs/app.js showEmptyState()).
  nothingInLineupLabel: "Nothing in the lineup yet",

  // #unmute (docs/app.js toggleMute()) — also the button's static initial
  // text in index.html (the player starts muted).
  tapToMuteLabel: "🔊 Tap to mute",
  tapToUnmuteLabel: "🔇 Tap to unmute",

  // Offline/schedule-failure message (docs/offline-message.js + docs/app.js
  // renderScheduleMessage()).
  lineupFailureMessage: "Couldn't load the schedule. Check your connection and try again.",

  // iOS install hint (static markup in index.html's #ios-install-hint;
  // ios-install-hint-ui.js only toggles its visibility, never its text).
  // Contains trusted, developer-authored markup (<strong>, an aria-hidden
  // icon span) — rendered via innerHTML by i18n-ui.js, never from visitor
  // input. "Nahom Eri TV" stays untranslated in both languages (brand name).
  installHintHtml:
    'Install Nahom Eri TV: tap <strong>Share</strong> <span aria-hidden="true">⎋</span> then <strong>Add to Home Screen</strong>.',
  installHintDismissAriaLabel: "Dismiss install hint",
};
