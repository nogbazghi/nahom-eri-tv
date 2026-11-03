// Tigrinya (Ge'ez script) chrome-text strings for the language toggle
// (ticket #31, part of spec #22). Pure data — a complete, linearly-readable
// copy deck. Keys here must exactly match docs/i18n/strings.en.js's keys
// (see the key-parity test in docs/i18n.test.js).
//
// NOTE for the translation reviewer: this is a best-effort machine-assisted
// draft (per spec #22's "Further Notes" — the implementing agent drafts this
// file, a human reviews the actual copy before merge). Please review for
// accuracy and tone before this ships.
//
// Scope: index.html's chrome text only (guide/player page, ticket #31).
// about.html's prose is ticket #32's job — new keys land here when that
// ticket starts, not before.
export const strings = {
  // #guide-toggle (docs/app.js openGuide()/closeGuide()) — also the
  // button's static initial text in index.html.
  guideToggleOpenLabel: "መደብ ▾",
  guideToggleCloseLabel: "ዕጸው ✕",

  // Guide panel cells (docs/app.js renderGuide()).
  nowLabel: "ሕጂ",
  nothingScheduledLabel: "ዝተመደበ የለን",

  // Corner badge empty state (docs/app.js showEmptyState()).
  nothingInLineupLabel: "ገና ኣብ መስርዕ የለን",

  // #unmute (docs/app.js toggleMute()) — also the button's static initial
  // text in index.html (the player starts muted).
  tapToMuteLabel: "🔊 ድምጺ ንምጥፋእ ጠውቕ",
  tapToUnmuteLabel: "🔇 ድምጺ ንምክፋት ጠውቕ",

  // Offline/schedule-failure message (docs/offline-message.js + docs/app.js
  // renderScheduleMessage()).
  lineupFailureMessage: "መደብ ምጽዓን ኣይተኻእለን። ግንኙነትካ ረጋግጽ እሞ ደጊምካ ፈትን።",

  // iOS install hint (static markup in index.html's #ios-install-hint;
  // ios-install-hint-ui.js only toggles its visibility, never its text).
  // Contains trusted, developer-authored markup (<strong>, an aria-hidden
  // icon span) — rendered via innerHTML by i18n-ui.js, never from visitor
  // input. "Nahom Eri TV" stays untranslated in both languages (brand name).
  installHintHtml:
    'ነቲ Nahom Eri TV ኣፕሊኬሽን ንምትካል፡ <strong>ኣካፍል</strong> ዝብል ጠውቕ <span aria-hidden="true">⎋</span> ድሕሪኡ <strong>ናብ መጀመርታ ገጽ ወስኽ</strong> ዝብል ምረጽ።',
  installHintDismissAriaLabel: "መልእኽቲ ምትካል ዕጸው",
};
