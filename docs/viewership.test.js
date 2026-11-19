import { test } from "node:test";
import assert from "node:assert/strict";

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

test("qualifiesForWatch: false before playback has sustained at all", () => {
  const state = tuneChannel("Weddings");
  assert.equal(qualifiesForWatch(state, 0), false);
});

test("qualifiesForWatch: true once sustained playback reaches the threshold", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 1000);
  assert.equal(qualifiesForWatch(state, 1000 + WATCH_THRESHOLD_MS), true);
});

test("qualifiesForWatch: false just short of the threshold", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 1000);
  assert.equal(qualifiesForWatch(state, 1000 + WATCH_THRESHOLD_MS - 1), false);
});

test("qualifiesForWatch: false while nothing is tuned (fresh state)", () => {
  const state = createViewershipState();
  assert.equal(qualifiesForWatch(state, WATCH_THRESHOLD_MS * 10), false);
});

test("qualifiesForWatch: a Live event tuning (null) never qualifies, no matter how long", () => {
  let state = tuneChannel(null);
  state = playbackSustaining(state, 0);
  assert.equal(qualifiesForWatch(state, WATCH_THRESHOLD_MS * 100), false);
});

test("qualifiesForWatch: false once already fired for this tuning, even well past the threshold", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 0);
  state = markWatchFired(state);
  assert.equal(qualifiesForWatch(state, WATCH_THRESHOLD_MS * 10), false);
});

test("tuneChannel: switching to a different Channel resets tracking toward the new one", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 0);
  // Mid-threshold on Weddings, then the viewer switches to Kebire.
  state = tuneChannel("Kebire");
  assert.equal(qualifiesForWatch(state, WATCH_THRESHOLD_MS - 1), false);

  // Kebire needs its own full threshold from this fresh start, not credit
  // for however long Weddings had already been sustaining.
  state = playbackSustaining(state, WATCH_THRESHOLD_MS - 1);
  assert.equal(
    qualifiesForWatch(state, WATCH_THRESHOLD_MS - 1 + WATCH_THRESHOLD_MS),
    true,
  );
});

test("tuneChannel: re-tuning the same Channel (e.g. Go to Live) also resets tracking", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 0);
  state = markWatchFired(state);

  state = tuneChannel("Weddings");
  assert.equal(qualifiesForWatch(state, 0), false); // the earlier fire no longer blocks it

  state = playbackSustaining(state, 0);
  assert.equal(qualifiesForWatch(state, WATCH_THRESHOLD_MS), true);
});

test("playbackInterrupted: resets the sustained clock, so a later resume needs a fresh full threshold", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 0);
  state = playbackInterrupted(state, WATCH_THRESHOLD_MS / 2); // paused partway through

  // Resuming at some later time starts a brand new window from that point.
  state = playbackSustaining(state, 5000);
  assert.equal(qualifiesForWatch(state, 5000 + WATCH_THRESHOLD_MS - 1), false);
  assert.equal(qualifiesForWatch(state, 5000 + WATCH_THRESHOLD_MS), true);
});

test("playbackSustaining: already-sustaining is a no-op, not a restarted clock", () => {
  let state = tuneChannel("Weddings");
  state = playbackSustaining(state, 1000);
  state = playbackSustaining(state, 9000); // a later, spurious PLAYING event
  assert.equal(qualifiesForWatch(state, 1000 + WATCH_THRESHOLD_MS), true);
});

test("watchBeaconPayload: carries only the channel identifier", () => {
  assert.deepEqual(watchBeaconPayload("weddings"), { channel: "weddings" });
  assert.deepEqual(Object.keys(watchBeaconPayload("weddings")), ["channel"]);
});
