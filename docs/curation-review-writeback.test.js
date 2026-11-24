import { test } from "node:test";
import assert from "node:assert/strict";
import {
  removeIdsFromVideosJson,
  appendBlocklistEntries,
  finishReview,
} from "./curation-review-writeback.js";

test("removeIdsFromVideosJson: drops videos whose id is in the given list, leaving the rest and other top-level keys untouched", () => {
  const videosJson = {
    videos: [{ id: "a1" }, { id: "b2" }, { id: "c3" }],
    schedules: { "Music - Modern": { scheduleStart: "2026-01-01" } },
  };

  assert.deepEqual(removeIdsFromVideosJson(videosJson, ["b2"]), {
    videos: [{ id: "a1" }, { id: "c3" }],
    schedules: { "Music - Modern": { scheduleStart: "2026-01-01" } },
  });
});

test("removeIdsFromVideosJson: drops videos matching ids from two different buckets (e.g. rejected and deferred) in one pass", () => {
  const videosJson = {
    videos: [{ id: "a1" }, { id: "b2" }, { id: "c3" }],
    schedules: {},
  };

  assert.deepEqual(removeIdsFromVideosJson(videosJson, ["b2", "c3"]), {
    videos: [{ id: "a1" }],
    schedules: {},
  });
});

test("appendBlocklistEntries: appends one entry per rejected candidate after a blank line, matching blocklist.yaml's hand-written shape", () => {
  const existing = "# Video IDs excluded due to takedown requests or disputes.\n";
  const rejected = [{ id: "abc123", reason: "off-topic noise" }];

  assert.equal(
    appendBlocklistEntries(existing, rejected, "2026-11-17"),
    '# Video IDs excluded due to takedown requests or disputes.\n\n- id: abc123\n  reason: "off-topic noise"\n  date: 2026-11-17\n',
  );
});

test("appendBlocklistEntries: a reason containing a double-quote is escaped so the result is still a valid quoted YAML scalar", () => {
  const existing = "existing\n";
  const rejected = [{ id: "xyz789", reason: 'titled "Fake" video' }];

  assert.equal(
    appendBlocklistEntries(existing, rejected, "2026-11-17"),
    'existing\n\n- id: xyz789\n  reason: "titled \\"Fake\\" video"\n  date: 2026-11-17\n',
  );
});

test("appendBlocklistEntries: multiple rejections each get their own entry, in order", () => {
  const rejected = [
    { id: "id1", reason: "reason one" },
    { id: "id2", reason: "reason two" },
  ];

  assert.equal(
    appendBlocklistEntries("existing\n", rejected, "2026-11-17"),
    'existing\n\n- id: id1\n  reason: "reason one"\n  date: 2026-11-17\n- id: id2\n  reason: "reason two"\n  date: 2026-11-17\n',
  );
});

test("appendBlocklistEntries: returns the text unchanged when there are no rejections", () => {
  assert.equal(appendBlocklistEntries("existing\n", [], "2026-11-17"), "existing\n");
});

test("appendBlocklistEntries: skips a rejected candidate whose id is already present, so a retry after a prior partial success can't duplicate it", () => {
  const existing = 'existing\n\n- id: already-blocked\n  reason: "earlier run"\n  date: 2026-11-16\n';

  assert.equal(
    appendBlocklistEntries(existing, [{ id: "already-blocked", reason: "retried reason" }], "2026-11-17"),
    existing,
  );
});

test("appendBlocklistEntries: appends only the not-yet-present candidate when one of several is already blocked", () => {
  const existing = 'existing\n\n- id: already-blocked\n  reason: "earlier run"\n  date: 2026-11-16\n';
  const rejected = [
    { id: "already-blocked", reason: "retried reason" },
    { id: "new-one", reason: "fresh reason" },
  ];

  assert.equal(
    appendBlocklistEntries(existing, rejected, "2026-11-17"),
    existing + '\n- id: new-one\n  reason: "fresh reason"\n  date: 2026-11-17\n',
  );
});

function createRecordingFakeClient({ currentBlocklistYaml = "existing\n" } = {}) {
  const calls = [];
  return {
    calls,
    async getFileSha(ref, path) {
      calls.push({ method: "getFileSha", ref, path });
      return path.endsWith("videos.json") ? "videos-sha" : "blocklist-sha";
    },
    async getFileContent(ref, path) {
      calls.push({ method: "getFileContent", ref, path });
      return currentBlocklistYaml;
    },
    async updateFile(branch, path, content, sha, message) {
      calls.push({ method: "updateFile", branch, path, content, sha, hasMessage: typeof message === "string" && message.length > 0 });
    },
    async mergePull(number) {
      calls.push({ method: "mergePull", number });
    },
  };
}

test("finishReview: when there are rejections, commits the trimmed videos.json and appended blocklist.yaml before merging the PR", async () => {
  const client = createRecordingFakeClient();
  const pr = { number: 5, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = {
    pr,
    videosJson: { videos: [{ id: "a1" }, { id: "b2" }], schedules: {} },
  };
  const writeBackPayload = {
    approvedIds: ["a1"],
    rejected: [{ id: "b2", reason: "off-topic" }],
    deferredIds: [],
  };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  assert.deepEqual(client.calls, [
    { method: "getFileSha", ref: "curation/weekly-update", path: "docs/data/videos.json" },
    {
      method: "updateFile",
      branch: "curation/weekly-update",
      path: "docs/data/videos.json",
      content: '{\n  "videos": [\n    {\n      "id": "a1"\n    }\n  ],\n  "schedules": {}\n}',
      sha: "videos-sha",
      hasMessage: true,
    },
    { method: "getFileContent", ref: "curation/weekly-update", path: "curation/blocklist.yaml" },
    { method: "getFileSha", ref: "curation/weekly-update", path: "curation/blocklist.yaml" },
    {
      method: "updateFile",
      branch: "curation/weekly-update",
      path: "curation/blocklist.yaml",
      content: 'existing\n\n- id: b2\n  reason: "off-topic"\n  date: 2026-11-17\n',
      sha: "blocklist-sha",
      hasMessage: true,
    },
    { method: "mergePull", number: 5 },
  ]);
});

test("finishReview: when there are no rejections and nothing deferred, skips both file updates and only merges the PR", async () => {
  const client = createRecordingFakeClient();
  const pr = { number: 7, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = {
    pr,
    videosJson: { videos: [{ id: "a1" }], schedules: {} },
  };
  const writeBackPayload = { approvedIds: ["a1"], rejected: [], deferredIds: [] };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  assert.deepEqual(client.calls, [{ method: "mergePull", number: 7 }]);
});

test("finishReview: builds the blocklist append from the branch's current content, not a stale load-time snapshot", async () => {
  const client = createRecordingFakeClient({ currentBlocklistYaml: "a newer entry already landed\n" });
  const pr = { number: 9, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = { pr, videosJson: { videos: [], schedules: {} } };
  const writeBackPayload = { approvedIds: [], rejected: [{ id: "c3", reason: "off-topic" }], deferredIds: [] };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  const blocklistUpdate = client.calls.find(
    (call) => call.method === "updateFile" && call.path === "curation/blocklist.yaml",
  );
  assert.equal(
    blocklistUpdate.content,
    'a newer entry already landed\n\n- id: c3\n  reason: "off-topic"\n  date: 2026-11-17\n',
  );
});

test("finishReview: retrying after a prior attempt's blocklist commit already succeeded skips re-committing it", async () => {
  const client = createRecordingFakeClient({
    currentBlocklistYaml: 'existing\n\n- id: b2\n  reason: "off-topic"\n  date: 2026-11-17\n',
  });
  const pr = { number: 5, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = { pr, videosJson: { videos: [{ id: "a1" }], schedules: {} } };
  const writeBackPayload = {
    approvedIds: ["a1"],
    rejected: [{ id: "b2", reason: "off-topic" }],
    deferredIds: [],
  };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  const blocklistCalls = client.calls.filter((call) => call.path === "curation/blocklist.yaml");
  assert.deepEqual(blocklistCalls, [
    { method: "getFileContent", ref: "curation/weekly-update", path: "curation/blocklist.yaml" },
  ]);
});

test("finishReview: deferred ids with no rejections are removed from videos.json but never touch the blocklist", async () => {
  const client = createRecordingFakeClient();
  const pr = { number: 11, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = {
    pr,
    videosJson: { videos: [{ id: "a1" }, { id: "d1" }], schedules: {} },
  };
  const writeBackPayload = { approvedIds: ["a1"], rejected: [], deferredIds: ["d1"] };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  assert.deepEqual(client.calls, [
    { method: "getFileSha", ref: "curation/weekly-update", path: "docs/data/videos.json" },
    {
      method: "updateFile",
      branch: "curation/weekly-update",
      path: "docs/data/videos.json",
      content: '{\n  "videos": [\n    {\n      "id": "a1"\n    }\n  ],\n  "schedules": {}\n}',
      sha: "videos-sha",
      hasMessage: true,
    },
    { method: "mergePull", number: 11 },
  ]);
});

test("finishReview: rejected and deferred ids are both removed from videos.json in one update, with only the rejected one blocklisted", async () => {
  const client = createRecordingFakeClient();
  const pr = { number: 13, headRef: "curation/weekly-update", headSha: "sha1" };
  const runData = {
    pr,
    videosJson: { videos: [{ id: "a1" }, { id: "r1" }, { id: "d1" }], schedules: {} },
  };
  const writeBackPayload = {
    approvedIds: ["a1"],
    rejected: [{ id: "r1", reason: "off-topic" }],
    deferredIds: ["d1"],
  };

  await finishReview(client, runData, writeBackPayload, "2026-11-17");

  const videosUpdate = client.calls.find(
    (call) => call.method === "updateFile" && call.path === "docs/data/videos.json",
  );
  assert.equal(
    videosUpdate.content,
    '{\n  "videos": [\n    {\n      "id": "a1"\n    }\n  ],\n  "schedules": {}\n}',
  );

  const blocklistUpdate = client.calls.find(
    (call) => call.method === "updateFile" && call.path === "curation/blocklist.yaml",
  );
  assert.equal(
    blocklistUpdate.content,
    'existing\n\n- id: r1\n  reason: "off-topic"\n  date: 2026-11-17\n',
  );
});
