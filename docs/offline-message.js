// Pure decision logic for the schedule's offline/error state: given the
// browser's current connectivity and how the last loadLineup() attempt went,
// which message (if any) should replace the guide? No DOM, no fetch, no
// side effects, so this is both <script type="module">-loadable by the
// browser (app.js) and import-able directly by node --test
// (offline-message.test.js) — see ticket #9.
export function selectLineupMessage({ online, status }) {
  if (!online) {
    return "No connection — the live schedule needs internet to load.";
  }

  if (status === "error") {
    return "Couldn't load the schedule. Check your connection and try again.";
  }

  return null;
}
