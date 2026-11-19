// Pure "is this a qualifying watch yet?" decision logic for the per-Channel
// viewership signal (ticket #115, part of #113). Tracks how long playback
// has been sustained, uninterrupted, for whatever Channel is currently
// tuned, and decides when that crosses the threshold that counts as one
// real watch. No DOM, no timers, no network — the real setTimeout/fetch
// glue lives in viewership-ui.js, same split as favorites.js/favorites-ui.js.
//
// `tuningId` identifies the current tuning for reset/fire-once bookkeeping
// only (app.js passes its Channel display name, or null while a Live event
// or nothing is tuned) — it is never itself sent in a beacon. The channel
// identifier actually sent to the Worker is resolved separately, from
// whichever video is playing when the threshold is reached, since a single
// Channel's lineup can draw from more than one channels.yaml source.

// Loosely ~10-15s per spec; the exact value within that range isn't
// otherwise specified.
export const WATCH_THRESHOLD_MS = 12000;

export function createViewershipState() {
  return { tuningId: null, sustainedSinceMs: null, firedForTuningId: null };
}

// A new tuning — a different Channel, a re-tune of the same Channel (e.g.
// "Go to Live"), or no Channel at all (a Live event, or nothing playing,
// passed as null so it can never qualify) — always starts tracking fresh.
// Never call this for natural advancement to the next video within a
// Channel's own cyclic lineup; that keeps the same tuning.
export function tuneChannel(tuningId) {
  return { tuningId, sustainedSinceMs: null, firedForTuningId: null };
}

// Playback has started/resumed: begins the sustained-playback clock, unless
// one is already running or there's no Channel tuned to attribute it to.
export function playbackSustaining(state, nowMs) {
  if (state.tuningId === null || state.sustainedSinceMs !== null) return state;
  return { ...state, sustainedSinceMs: nowMs };
}

// Playback paused, buffered, ended, or errored: a gap breaks "sustained", so
// the clock resets rather than pausing/resuming — the next
// playbackSustaining() call starts a fresh threshold window.
export function playbackInterrupted(state) {
  if (state.sustainedSinceMs === null) return state;
  return { ...state, sustainedSinceMs: null };
}

// True once sustained, uninterrupted playback for the current tuning has
// lasted WATCH_THRESHOLD_MS and a beacon hasn't already fired for it.
export function qualifiesForWatch(state, nowMs) {
  return (
    state.tuningId !== null &&
    state.sustainedSinceMs !== null &&
    state.firedForTuningId !== state.tuningId &&
    nowMs - state.sustainedSinceMs >= WATCH_THRESHOLD_MS
  );
}

export function markWatchFired(state) {
  return { ...state, firedForTuningId: state.tuningId };
}

// The entire wire payload — the channel identifier and nothing else, so the
// "no cookie/fingerprint/session identifier" privacy floor (spec #113) is
// enforced structurally by this being the only thing that can be sent.
export function watchBeaconPayload(channelIdentifier) {
  return { channel: channelIdentifier };
}
