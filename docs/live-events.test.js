import { test } from "node:test";
import assert from "node:assert/strict";

import { isLiveEventVisible, visibleLiveEvents } from "./live-events.js";

const START = new Date("2026-06-15T18:00:00.000Z");
const START_MS = START.getTime();
const HOUR_MS = 60 * 60 * 1000;

function eventAt(overrides = {}) {
  return {
    id: "abc123",
    displayName: "Test Wedding",
    title: "Test Wedding — Live",
    channel: "Organizer Channel",
    scheduledStart: START.toISOString(),
    ...overrides,
  };
}

test("before the default 2h lead time: not visible", () => {
  const nowMs = START_MS - 2 * HOUR_MS - 1000;
  assert.equal(isLiveEventVisible(eventAt(), nowMs), false);
});

test("exactly at the default lead-time start: visible", () => {
  const nowMs = START_MS - 2 * HOUR_MS;
  assert.equal(isLiveEventVisible(eventAt(), nowMs), true);
});

test("exactly at the default 24h expiry: visible", () => {
  const nowMs = START_MS + 24 * HOUR_MS;
  assert.equal(isLiveEventVisible(eventAt(), nowMs), true);
});

test("just after the default expiry: not visible", () => {
  const nowMs = START_MS + 24 * HOUR_MS + 1000;
  assert.equal(isLiveEventVisible(eventAt(), nowMs), false);
});

test("an overridden lead time is respected instead of the default", () => {
  const event = eventAt({ leadTimeHours: 48 });
  const nowMs = START_MS - 36 * HOUR_MS; // outside the 2h default, inside the 48h override
  assert.equal(isLiveEventVisible(event, nowMs), true);
});

test("an overridden expiry is respected instead of the default", () => {
  const event = eventAt({ expireAfterHours: 72 });
  const nowMs = START_MS + 48 * HOUR_MS; // outside the 24h default, inside the 72h override
  assert.equal(isLiveEventVisible(event, nowMs), true);
});

test("visibleLiveEvents: keeps only the entries currently inside their own window", () => {
  const visible = eventAt({ id: "visible" });
  const notYet = eventAt({
    id: "not-yet",
    scheduledStart: new Date(START_MS + 100 * HOUR_MS).toISOString(),
  });
  const expired = eventAt({
    id: "expired",
    scheduledStart: new Date(START_MS - 100 * HOUR_MS).toISOString(),
  });
  assert.deepEqual(visibleLiveEvents([visible, notYet, expired], START_MS), [visible]);
});
