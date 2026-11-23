// On Safari/WebKit, forced playback of the cross-origin YouTube iframe is
// blocked by the platform itself unless player.playVideo() is called
// synchronously inside a real gesture's own event handler (see ADR-0018).
// This test doesn't re-verify that platform fact (already established via
// real-WebKit testing, recorded in the ADR) — it verifies only app.js's own
// wiring: does a document-level gesture correctly call playVideo() when,
// and only when, it should. A fake window.YT stands in for the real
// cross-origin iframe/API, so the test is fast, deterministic, and
// independent of real network or real video playback.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");

// app.js is a `type="module"` script, and Chromium refuses to load module
// scripts over `file://` at all (unlike hidden-elements.test.js's seam,
// which only reads static CSS and never needs app.js to actually execute).
// This test's seam genuinely needs app.js to run, so it needs a real
// origin — an ephemeral static server for the test's own lifetime, not a
// project-level dev server.
const CONTENT_TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };

function startDocsServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const filePath = path.join(DOCS_DIR, decodeURIComponent(new URL(req.url, "http://x").pathname));
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

const PLAYER_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, UNSTARTED: -1, CUED: 5 };

// Served in place of the real https://www.youtube.com/iframe_api script.
// Defines a minimal window.YT whose Player starts in `initialState` and
// counts playVideo() calls on window.__playVideoCalls, then calls the real
// app.js's own window.onYouTubeIframeAPIReady — exactly like the real
// YouTube script does once it finishes loading. The real script is a
// blocking classic <script>, so it runs *during* HTML parsing, strictly
// before app.js's deferred module executes; the real YouTube loader's own
// callback only actually fires later, once a second script it injects
// finishes loading over the network. Polling for
// window.onYouTubeIframeAPIReady to exist (rather than guessing a fixed
// delay) reproduces that same "fires once app.js is ready, however long
// that takes" ordering without depending on deferred-script timing
// specifics.
// `extraDelayMs` simulates how long the real loader's own async init takes
// *after* this (fast-loading) blocking script tag has already returned —
// this script's own fetch/execution never itself blocks the page, same as
// the real one; only `onYouTubeIframeAPIReady` firing is ever delayed.
function fakeIframeApiSource(initialState, extraDelayMs = 0) {
  return `
    window.__playVideoCalls = 0;
    window.YT = {
      PlayerState: ${JSON.stringify(PLAYER_STATE)},
      Player: function (elementId, config) {
        window.__playerConstructed = true;
        this._state = ${initialState};
        this.getPlayerState = function () { return this._state; };
        this.playVideo = function () {
          window.__playVideoCalls++;
          this._state = window.YT.PlayerState.PLAYING;
        };
        this.mute = function () {};
      },
    };
    (function poll() {
      if (typeof window.onYouTubeIframeAPIReady === "function") {
        setTimeout(function () { window.onYouTubeIframeAPIReady(); }, ${extraDelayMs});
      } else {
        setTimeout(poll, 10);
      }
    })();
  `;
}

let browser;
let server;
let baseUrl;
before(async () => {
  browser = await chromium.launch();
  server = await startDocsServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
});

test("a gesture calls playVideo() once when the player exists and isn't already playing", async () => {
  const page = await browser.newPage();
  try {
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({ contentType: "application/javascript", body: fakeIframeApiSource(PLAYER_STATE.UNSTARTED) })
    );
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__playerConstructed === true);

    await page.click("body");

    const calls = await page.evaluate(() => window.__playVideoCalls);
    assert.equal(calls, 1, "expected playVideo() to be called exactly once after the gesture");
  } finally {
    await page.close();
  }
});

test("a gesture does not call playVideo() again once the player is already playing", async () => {
  const page = await browser.newPage();
  try {
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({ contentType: "application/javascript", body: fakeIframeApiSource(PLAYER_STATE.PLAYING) })
    );
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });
    await page.waitForFunction(() => window.__playerConstructed === true);

    await page.click("body");

    const calls = await page.evaluate(() => window.__playVideoCalls);
    assert.equal(calls, 0, "playVideo() should not be called again once already PLAYING");
  } finally {
    await page.close();
  }
});

test("a gesture before the player exists is a no-op, and a later gesture still succeeds", async () => {
  const page = await browser.newPage();
  try {
    // The script itself loads fast (so page.goto's "load" isn't blocked by
    // it), but onYouTubeIframeAPIReady doesn't fire — and so the player
    // isn't constructed — until well after that, matching how the real
    // loader's own async init works. That gives a real window, after
    // navigation has already settled, to click once before the player
    // exists.
    const PLAYER_READY_DELAY_MS = 500;
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: fakeIframeApiSource(PLAYER_STATE.UNSTARTED, PLAYER_READY_DELAY_MS),
      })
    );

    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });

    await page.click("body"); // gesture #1: player doesn't exist yet
    assert.equal(
      await page.evaluate(() => window.__playerConstructed),
      undefined,
      "test setup invalid: the player must not exist yet for this gesture to be a real no-op"
    );

    await page.waitForFunction(() => window.__playerConstructed === true);
    await page.click("body"); // gesture #2: player now exists

    const calls = await page.evaluate(() => window.__playVideoCalls);
    assert.equal(calls, 1, "expected exactly one playVideo() call, from the second gesture");
  } finally {
    await page.close();
  }
});
