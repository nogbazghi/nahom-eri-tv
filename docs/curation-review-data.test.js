import { test } from "node:test";
import assert from "node:assert/strict";
import { findOpenCurationPr, fetchRunData, computeAdditions } from "./curation-review-data.js";

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

test("computeAdditions: a video present only on the branch is an addition", () => {
  const mainVideosJson = { videos: [] };
  const branchVideosJson = { videos: [{ id: "abc123", source: "weddings" }] };

  assert.deepEqual(computeAdditions(mainVideosJson, branchVideosJson), [
    { id: "abc123", source: "weddings" },
  ]);
});

test("computeAdditions: a video present in both with the same (id, source) is not an addition", () => {
  const mainVideosJson = { videos: [{ id: "abc123", source: "weddings" }] };
  const branchVideosJson = { videos: [{ id: "abc123", source: "weddings" }] };

  assert.deepEqual(computeAdditions(mainVideosJson, branchVideosJson), []);
});

test("computeAdditions: two entries sharing an id but with different source are both independently detected as additions", () => {
  const mainVideosJson = { videos: [{ id: "abc123", source: "weddings" }] };
  const branchVideosJson = {
    videos: [
      { id: "abc123", source: "weddings" },
      { id: "abc123", source: "music_modern" },
    ],
  };

  assert.deepEqual(computeAdditions(mainVideosJson, branchVideosJson), [
    { id: "abc123", source: "music_modern" },
  ]);
});

test("computeAdditions: a video present in main but absent from the branch is not treated as a removal", () => {
  const mainVideosJson = { videos: [{ id: "abc123", source: "weddings" }] };
  const branchVideosJson = { videos: [] };

  assert.deepEqual(computeAdditions(mainVideosJson, branchVideosJson), []);
});

test("fetchRunData: diffs videos.json on main against the PR's head sha, and reads blocklist.yaml off the head sha", async () => {
  const requestedPaths = [];
  const fakeClient = {
    async getFileContent(ref, path) {
      requestedPaths.push(`getFileContent ${ref} ${path}`);
      if (ref === "main" && path === "docs/data/videos.json") {
        return JSON.stringify({ videos: [{ id: "existing", source: "weddings" }], schedules: {} });
      }
      if (ref === "sha2" && path === "docs/data/videos.json") {
        return JSON.stringify({
          videos: [
            { id: "existing", source: "weddings" },
            { id: "new-one", source: "music_modern" },
          ],
          schedules: {},
        });
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
    additions: [{ id: "new-one", source: "music_modern" }],
    videosJson: {
      videos: [
        { id: "existing", source: "weddings" },
        { id: "new-one", source: "music_modern" },
      ],
      schedules: {},
    },
    blocklistYamlText: "- id: abc123\n  reason: test\n  date: 2026-01-01\n",
  });
  assert.deepEqual(requestedPaths, [
    "getFileContent main docs/data/videos.json",
    "getFileContent sha2 docs/data/videos.json",
    "getFileContent sha2 curation/blocklist.yaml",
  ]);
});
