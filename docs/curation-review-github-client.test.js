// Regression coverage for issue #145: getFileContent must request GitHub's
// raw media type and read the response as text, not JSON+base64 — the
// Contents API's default media type omits `content` entirely (returning
// `""`, not valid base64) once a file exceeds its 1MB inline-content limit,
// which crashed the review dashboard. Everything else in this file stays
// untested real-network glue per its header comment (same as
// favorites-ui.js/i18n-ui.js) — this one path gets a test because it's the
// specific thing that broke and will keep recurring as videos.json grows.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createGithubClient } from "./curation-review-github-client.js";

test("getFileContent: requests the raw media type and returns the body as plain text", async (t) => {
  let capturedAccept;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    capturedAccept = options.headers.Accept;
    return {
      ok: true,
      text: async () => "raw file content, any size — no base64, no JSON wrapper",
      json: async () => {
        throw new Error("json() should not be called for a raw request — this is the bug #145 fixes");
      },
    };
  });

  const client = createGithubClient("fake-token");
  const content = await client.getFileContent("sha123", "docs/data/videos.json");

  assert.equal(content, "raw file content, any size — no base64, no JSON wrapper");
  assert.equal(capturedAccept, "application/vnd.github.raw+json");
});

test("listOpenPulls: still uses the default JSON media type and parses a JSON body, unaffected by the raw-content fix", async (t) => {
  let capturedAccept;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    capturedAccept = options.headers.Accept;
    return {
      ok: true,
      json: async () => [
        { number: 1, head: { ref: "curation/weekly-update", sha: "abc" }, html_url: "https://example.com/pr/1" },
      ],
      text: async () => {
        throw new Error("text() should not be called for a non-raw request");
      },
    };
  });

  const client = createGithubClient("fake-token");
  const pulls = await client.listOpenPulls();

  assert.deepEqual(pulls, [
    { number: 1, headRef: "curation/weekly-update", headSha: "abc", htmlUrl: "https://example.com/pr/1" },
  ]);
  assert.equal(capturedAccept, "application/vnd.github+json");
});
