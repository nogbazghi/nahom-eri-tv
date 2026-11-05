// English chrome-text strings for the language toggle (ticket #31, part of
// spec #22). Pure data — a complete, linearly-readable copy deck. Keys here
// must exactly match docs/i18n/strings.ti.js's keys (see the key-parity test
// in docs/i18n.test.js); this file is also translate()'s English fallback
// source when a key is missing from the active language.
//
// Scope: index.html's chrome text (ticket #31) plus about.html's prose
// (ticket #32) — the page's entire content, since about.html has no
// separate content/data text the way index.html's video titles/channel
// names do.
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

  // #go-live (docs/app.js goLive()) — also the button's static initial text
  // in index.html. Text stays the same whether enabled or disabled; only the
  // native `disabled` attribute changes (ticket #55, part of #46).
  goLiveLabel: "🔴 Go to Live",

  // Offline/schedule-failure message (docs/offline-message.js + docs/app.js
  // renderScheduleMessage()).
  lineupFailureMessage: "Couldn't load the schedule. Check your connection and try again.",

  // #cast-button (docs/cast-sender.js), ticket #39 — icon-only, so its
  // accessible name comes entirely from this aria-label.
  castButtonAriaLabel: "Cast to TV",

  // iOS install hint (static markup in index.html's #ios-install-hint;
  // ios-install-hint-ui.js only toggles its visibility, never its text).
  // Contains trusted, developer-authored markup (<strong>, an aria-hidden
  // icon span) — rendered via innerHTML by i18n-ui.js, never from visitor
  // input. "Nahom Eri TV" stays untranslated in both languages (brand name).
  installHintHtml:
    'Install Nahom Eri TV: tap <strong>Share</strong> <span aria-hidden="true">⎋</span> then <strong>Add to Home Screen</strong>.',
  installHintDismissAriaLabel: "Dismiss install hint",

  // about.html prose (ticket #32). The page's entire content is in scope —
  // there's no separate content/data text on this page, unlike index.html.
  // "Nahom Eri TV" (the brand name) stays untranslated within these
  // strings in both languages, same exclusion as ticket #31.
  aboutWhatItIsHeading: "What it is",
  aboutWhatItIsIntro:
    "Nahom Eri TV is a broadcast-style streaming service for Eritrean and Tigrinya diaspora content. You tune in to a channel already playing — the way a real TV channel works — instead of picking a video from a list. Every channel runs on its own fixed, continuous schedule, so everyone watching at the same moment sees the same thing. The service is organized into channels, each curated around its own topic or creator, with more added over time.",
  aboutNothingDownloaded:
    "Nothing is downloaded, stored, or rehosted: every video plays directly from YouTube's own player, so creators keep their views and control of their uploads.",

  aboutWhoItsForHeading: "Who it's for",
  aboutWhoItsForParagraph:
    "Eritrean and Tigrinya-speaking diaspora viewers who want to see their community's weddings, culture, and everyday life without searching for it — someone abroad catching up over coffee, a family planning their own wedding looking for ideas, a younger viewer curious how traditions look today, or a creator whose work deserves a wider audience.",

  aboutHowToUseHeading: "How to use it",
  aboutUnmuteInstructionHtml:
    "Just open it — a channel starts playing right away, muted at first. Tap the unmute button (or press <kbd>M</kbd>) to turn on sound.",
  aboutGuideInstructionHtml:
    "To see what's on or switch channels, open the guide — tap <strong>Guide</strong> in the toolbar (or press <kbd>G</kbd>), then use the up/down arrows or a vertical swipe to move between channels, and press <kbd>Enter</kbd> (or tap, or swipe right) to tune in. Press <kbd>Esc</kbd> to close the guide.",
  aboutInstallInstruction:
    "On a phone, you can install Nahom Eri TV like an app — add it to your home screen for one-tap access and instant loading, even on a weak connection.",
};
