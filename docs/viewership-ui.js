// Wires the pure watch-qualification decision logic (viewership.js) up to
// the real YouTube player-state-change hook, a real setTimeout, and a real
// fetch() call to the deployed Worker (ticket #115, part of #113). Kept
// separate from app.js and from viewership.js itself — same split as
// favorites.js/favorites-ui.js: the decision logic stays pure and
// unit-testable, all the side-effecting (timer/network) code lives here.
// Untested glue, same role as cast-sender.js's real Cast SDK calls —
// verified by running the app.
import {
  createViewershipState,
  tuneChannel,
  playbackSustaining,
  playbackInterrupted,
  qualifiesForWatch,
  markWatchFired,
  watchBeaconPayload,
  WATCH_THRESHOLD_MS,
} from "./viewership.js";

// Set once the Worker from ticket #114 is actually deployed (see
// worker/README.md) — until then this points nowhere and every beacon
// fails silently, which is exactly the required "no effect on playback"
// behavior anyway.
const WATCH_BEACON_URL = "https://REPLACE_WITH_DEPLOYED_WORKER_URL";

let state = createViewershipState();
let timer = null;
// The channel identifier to send if the pending timer fires — captured when
// sustaining starts, since anything that would change it (switching,
// pausing, buffering, ending) clears the timer first (see below).
let pendingChannelIdentifier = null;

function clearPendingTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

// Called on every Channel switch/re-tune (app.js's switchChannel()) and on
// tuning a Live event (tuneLiveEvent(), passing null — a Live event's watch
// never qualifies). Never called for natural advancement to the next video
// within a Channel's own lineup; that keeps the same tuning.
export function retuneWatchTracking(tuningId) {
  clearPendingTimer();
  pendingChannelIdentifier = null;
  state = tuneChannel(tuningId);
}

// Called from app.js's onPlayerStateChange when playback enters PLAYING.
// `channelIdentifier` is the currently-playing video's own channels.yaml
// `source` field — refreshed on every call (not just when sustaining
// starts), since a sustained-playback window can now span a natural
// advance to the lineup's next video (a different `source`, possibly): the
// beacon should always attribute to whatever's playing when it fires.
export function notePlaybackPlaying(channelIdentifier) {
  pendingChannelIdentifier = channelIdentifier;
  state = playbackSustaining(state, Date.now());
  if (state.sustainedSinceMs === null || timer !== null) return;

  timer = setTimeout(() => {
    timer = null;
    maybeSendBeacon();
  }, WATCH_THRESHOLD_MS);
}

// Called for every other player state (paused, buffering, ended, cued,
// unstarted) and on a player error — any gap breaks "sustained", so the
// clock resets rather than pausing/resuming.
export function notePlaybackInterrupted() {
  clearPendingTimer();
  state = playbackInterrupted(state);
}

function maybeSendBeacon() {
  if (!qualifiesForWatch(state, Date.now())) return;
  state = markWatchFired(state);
  sendBeacon(pendingChannelIdentifier);
}

// Fire-and-forget POST — a failed or blocked request (network error,
// ad-blocker, Worker not yet deployed) must never affect playback, so every
// failure mode is swallowed silently.
function sendBeacon(channelIdentifier) {
  fetch(WATCH_BEACON_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(watchBeaconPayload(channelIdentifier)),
  }).catch(() => {});
}
