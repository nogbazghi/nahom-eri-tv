import { test } from "node:test";
import assert from "node:assert/strict";

import {
  isAllowedOrigin,
  isKnownChannel,
  isoWeekKey,
  watchCountKey,
  shouldAcceptWatch,
  recordWatch,
  default as worker,
} from "./watch-counter.js";

const ALLOWED_ORIGIN = "https://nahomeri.tv";
const KNOWN_CHANNELS = ["weddings", "comedy", "kebire"];

function fakeKv(initial = {}) {
  const store = { ...initial };
  return {
    async get(key) {
      return key in store ? store[key] : null;
    },
    async put(key, value) {
      store[key] = value;
    },
    store,
  };
}

function postRequest({ origin, body }) {
  const headers = new Headers();
  if (origin !== undefined) headers.set("Origin", origin);
  return new Request("https://worker.example/watch", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

test("isAllowedOrigin: matches only the exact configured origin", () => {
  assert.equal(isAllowedOrigin(ALLOWED_ORIGIN, ALLOWED_ORIGIN), true);
  assert.equal(isAllowedOrigin("https://evil.example", ALLOWED_ORIGIN), false);
  assert.equal(isAllowedOrigin(null, ALLOWED_ORIGIN), false);
  assert.equal(isAllowedOrigin(undefined, ALLOWED_ORIGIN), false);
});

test("isKnownChannel: matches only channels in the known list", () => {
  assert.equal(isKnownChannel("weddings", KNOWN_CHANNELS), true);
  assert.equal(isKnownChannel("made-up-channel", KNOWN_CHANNELS), false);
});

test("isoWeekKey: computes the ISO 8601 week for a date", () => {
  assert.equal(isoWeekKey(new Date("2026-11-18T00:00:00Z")), "2026-W47");
  assert.equal(isoWeekKey(new Date("2026-01-01T00:00:00Z")), "2026-W01");
});

test("isoWeekKey: a late-December date can belong to the next year's week 1", () => {
  assert.equal(isoWeekKey(new Date("2025-12-29T00:00:00Z")), "2026-W01");
  assert.equal(isoWeekKey(new Date("2018-12-31T00:00:00Z")), "2019-W01");
});

test("isoWeekKey: an early-January date can belong to the previous year's last week", () => {
  assert.equal(isoWeekKey(new Date("2017-01-01T00:00:00Z")), "2016-W52");
});

test("watchCountKey: combines the channel identifier and ISO week", () => {
  assert.equal(watchCountKey("weddings", new Date("2026-11-18T00:00:00Z")), "weddings:2026-W47");
});

test("shouldAcceptWatch: accepts only a known channel from the allowed origin", () => {
  assert.equal(
    shouldAcceptWatch({
      origin: ALLOWED_ORIGIN,
      channelId: "weddings",
      allowedOrigin: ALLOWED_ORIGIN,
      knownChannels: KNOWN_CHANNELS,
    }),
    true,
  );
});

test("shouldAcceptWatch: rejects a missing or incorrect origin even for a known channel", () => {
  assert.equal(
    shouldAcceptWatch({
      origin: null,
      channelId: "weddings",
      allowedOrigin: ALLOWED_ORIGIN,
      knownChannels: KNOWN_CHANNELS,
    }),
    false,
  );
  assert.equal(
    shouldAcceptWatch({
      origin: "https://evil.example",
      channelId: "weddings",
      allowedOrigin: ALLOWED_ORIGIN,
      knownChannels: KNOWN_CHANNELS,
    }),
    false,
  );
});

test("shouldAcceptWatch: rejects an unknown channel even from the allowed origin", () => {
  assert.equal(
    shouldAcceptWatch({
      origin: ALLOWED_ORIGIN,
      channelId: "made-up-channel",
      allowedOrigin: ALLOWED_ORIGIN,
      knownChannels: KNOWN_CHANNELS,
    }),
    false,
  );
});

test("recordWatch: increments a fresh key from nothing to 1", async () => {
  const kv = fakeKv();
  await recordWatch(kv, "weddings:2026-W47");
  assert.equal(kv.store["weddings:2026-W47"], "1");
});

test("recordWatch: repeating increments the same key again rather than deduplicating", async () => {
  const kv = fakeKv();
  await recordWatch(kv, "weddings:2026-W47");
  await recordWatch(kv, "weddings:2026-W47");
  await recordWatch(kv, "weddings:2026-W47");
  assert.equal(kv.store["weddings:2026-W47"], "3");
});

test("recordWatch: a different ISO week gets its own key, not a reused or reset one", async () => {
  const kv = fakeKv({ "weddings:2026-W47": "5" });
  await recordWatch(kv, "weddings:2026-W48");
  assert.equal(kv.store["weddings:2026-W47"], "5");
  assert.equal(kv.store["weddings:2026-W48"], "1");
});

test("worker.fetch: a valid Origin and known channel increments that channel's current-week counter", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };
  const request = postRequest({ origin: ALLOWED_ORIGIN, body: { channel: "weddings" } });

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  const key = watchCountKey("weddings", new Date());
  assert.equal(kv.store[key], "1");
});

test("worker.fetch: a missing Origin is rejected and increments nothing", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };
  const request = postRequest({ body: { channel: "weddings" } });

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  assert.deepEqual(kv.store, {});
});

test("worker.fetch: an incorrect Origin is rejected and increments nothing", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };
  const request = postRequest({ origin: "https://evil.example", body: { channel: "weddings" } });

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  assert.deepEqual(kv.store, {});
});

test("worker.fetch: an unknown channel identifier is rejected, creating no new KV key", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };
  const request = postRequest({ origin: ALLOWED_ORIGIN, body: { channel: "made-up-channel" } });

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  assert.deepEqual(kv.store, {});
});

test("worker.fetch: an OPTIONS preflight gets CORS headers so the browser allows the real POST through", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };
  const request = new Request("https://worker.example/watch", {
    method: "OPTIONS",
    headers: { Origin: ALLOWED_ORIGIN },
  });

  const response = await worker.fetch(request, env);

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), ALLOWED_ORIGIN);
  assert.equal(response.headers.get("Access-Control-Allow-Methods"), "POST");
});

test("worker.fetch: repeating a valid POST increments the same week's key again", async () => {
  const kv = fakeKv();
  const env = { ALLOWED_ORIGIN, WATCH_COUNTS: kv };

  await worker.fetch(postRequest({ origin: ALLOWED_ORIGIN, body: { channel: "weddings" } }), env);
  await worker.fetch(postRequest({ origin: ALLOWED_ORIGIN, body: { channel: "weddings" } }), env);

  const key = watchCountKey("weddings", new Date());
  assert.equal(kv.store[key], "2");
});
