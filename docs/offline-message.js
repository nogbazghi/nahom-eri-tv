// Pure decision logic for the schedule's offline/error state: given the
// browser's current connectivity and how the last loadLineup() attempt went,
// which message (if any) should replace the guide? No DOM, no fetch, no
// side effects, so this is both <script type="module">-loadable by the
// browser (app.js) and import-able directly by node --test
// (offline-message.test.js) — see ticket #9.
//
// Per spec issue #7, any failure to load the schedule — offline, or online
// but the fetch/response itself failed (e.g. a bad status or malformed
// JSON) — is surfaced as the exact same message. The cause isn't something
// a visitor can act on differently, so it isn't worth distinguishing.
//
// This is a docs/i18n.js translation *key*, not the final display text —
// per spec #22/ticket #31, the offline/schedule-failure message is chrome
// text and must flip with the language toggle. The caller (docs/app.js)
// resolves it to the active language's string via translate() before
// putting it in the DOM; see docs/i18n/strings.en.js's/strings.ti.js's
// lineupFailureMessage key.
export const LINEUP_FAILURE_MESSAGE_KEY = "lineupFailureMessage";

export function selectLineupMessage({ online, status }) {
  if (!online || status === "error") {
    return LINEUP_FAILURE_MESSAGE_KEY;
  }

  return null;
}
