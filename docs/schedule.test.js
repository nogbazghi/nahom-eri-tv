import { test } from "node:test";
import assert from "node:assert/strict";

import {
  totalDuration,
  currentPosition,
  videosForChannel,
  channelNowState,
} from "./schedule.js";

test("totalDuration: sums the duration of every video in the list", () => {
  const videos = [{ duration: 30 }, { duration: 45 }, { duration: 15 }];
  assert.equal(totalDuration(videos), 90);
});

test("totalDuration: zero for an empty list", () => {
  assert.equal(totalDuration([]), 0);
});

test("videosForChannel: keeps only videos whose channels list includes the given channel", () => {
  const allVideos = [
    { id: "a", channels: ["Kids"] },
    { id: "b", channels: ["Kids", "News"] },
    { id: "c", channels: ["News"] },
  ];
  assert.deepEqual(videosForChannel(allVideos, "Kids"), [allVideos[0], allVideos[1]]);
});

test("videosForChannel: empty list for a channel nothing is scheduled on", () => {
  const allVideos = [{ id: "a", channels: ["News"] }];
  assert.deepEqual(videosForChannel(allVideos, "Kids"), []);
});

test("currentPosition: a position partway through the first video", () => {
  const videos = [{ duration: 60 }, { duration: 60 }];
  const scheduleStartMs = Date.now() - 20_000; // 20s into the lineup
  const { index, offset } = currentPosition(videos, scheduleStartMs);
  assert.equal(index, 0);
  assert.equal(offset, 20);
});

test("currentPosition: wraps past the end of the lineup back to the start", () => {
  const videos = [{ duration: 60 }, { duration: 60 }];
  // 150s elapsed against a 120s lineup wraps to 30s into the cycle -> video 0, offset 30.
  const scheduleStartMs = Date.now() - 150_000;
  const { index, offset } = currentPosition(videos, scheduleStartMs);
  assert.equal(index, 0);
  assert.equal(offset, 30);
});

test("currentPosition: a channel with an empty video list has no position", () => {
  assert.deepEqual(currentPosition([], Date.now()), { index: -1, offset: 0 });
});

test("channelNowState: combines a channel's videos with its current position", () => {
  const allVideos = [
    { id: "a", channels: ["Kids"], duration: 60 },
    { id: "b", channels: ["Kids"], duration: 60 },
  ];
  const schedules = { Kids: { scheduleStart: new Date(Date.now() - 20_000).toISOString() } };
  const { videos, index, offset } = channelNowState(allVideos, schedules, "Kids");
  assert.deepEqual(videos, allVideos);
  assert.equal(index, 0);
  assert.equal(offset, 20);
});

test("channelNowState: a channel with an empty video list reports no position", () => {
  const allVideos = [{ id: "a", channels: ["News"], duration: 60 }];
  const schedules = { Kids: { scheduleStart: new Date().toISOString() } };
  const { videos, index, offset } = channelNowState(allVideos, schedules, "Kids");
  assert.deepEqual(videos, []);
  assert.equal(index, -1);
  assert.equal(offset, 0);
});
