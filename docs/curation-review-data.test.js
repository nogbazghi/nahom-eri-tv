import { test } from "node:test";
import assert from "node:assert/strict";
import { findOpenCurationPr, fetchRunData } from "./curation-review-data.js";

test("findOpenCurationPr: returns the open PR whose head ref matches the standing branch", async () => {
  const fakeClient = {
    async listOpenPulls() {
      return [
        { number: 1, headRef: "some-other-branch", headSha: "sha1" },
        { number: 2, headRef: "curation/weekly-update", headSha: "sha2" },
      ];
    },
  };

  const pr = await findOpenCurationPr(fakeClient, "curation/weekly-update");

  assert.deepEqual(pr, { number: 2, headRef: "curation/weekly-update", headSha: "sha2" });
});

test("findOpenCurationPr: returns null when no open PR targets the standing branch", async () => {
  const fakeClient = {
    async listOpenPulls() {
      return [{ number: 1, headRef: "some-other-branch", headSha: "sha1" }];
    },
  };

  const pr = await findOpenCurationPr(fakeClient, "curation/weekly-update");

  assert.equal(pr, null);
});

test("fetchRunData: reads every .pending/<channel>.json summary, videos.json, and blocklist.yaml off the PR's head sha", async () => {
  const requestedPaths = [];
  const fakeClient = {
    async listDirectory(ref, path) {
      requestedPaths.push(`listDirectory ${ref} ${path}`);
      return ["music_modern.json", "weddings.json"];
    },
    async getFileContent(ref, path) {
      requestedPaths.push(`getFileContent ${ref} ${path}`);
      if (path === "curation/.pending/music_modern.json") {
        return JSON.stringify({ channel: "music_modern", additions: [], removals: [] });
      }
      if (path === "curation/.pending/weddings.json") {
        return JSON.stringify({ channel: "weddings", additions: [], removals: [] });
      }
      if (path === "docs/data/videos.json") {
        return JSON.stringify({ videos: [], schedules: {} });
      }
      if (path === "curation/blocklist.yaml") {
        return "- id: abc123\n  reason: test\n  date: 2026-01-01\n";
      }
      throw new Error(`unexpected path ${path}`);
    },
  };
  const pr = { number: 2, headRef: "curation/weekly-update", headSha: "sha2" };

  const runData = await fetchRunData(fakeClient, pr);

  assert.deepEqual(runData, {
    pendingSummaries: [
      { channel: "music_modern", additions: [], removals: [] },
      { channel: "weddings", additions: [], removals: [] },
    ],
    videosJson: { videos: [], schedules: {} },
    blocklistYamlText: "- id: abc123\n  reason: test\n  date: 2026-01-01\n",
  });
  assert.deepEqual(requestedPaths, [
    "listDirectory sha2 curation/.pending",
    "getFileContent sha2 curation/.pending/music_modern.json",
    "getFileContent sha2 curation/.pending/weddings.json",
    "getFileContent sha2 docs/data/videos.json",
    "getFileContent sha2 curation/blocklist.yaml",
  ]);
});
