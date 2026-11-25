// The cross-origin https://www.youtube.com/iframe_api script is a classic,
// non-deferred <script>: it runs *during* HTML parsing, strictly before
// app.js's deferred module. The real loader checks, at that exact moment,
// whether window.onYouTubeIframeAPIReady is already a function — and if it
// isn't yet (because app.js hasn't run), it never retries; the player is
// silently never constructed (ticket #164). This is the opposite assumption
// from docs/browser-tests/autoplay-gesture-unlock.test.js's fixture, which
// polls/retries until the callback exists — an accurate model of nothing
// real, and one that can't expose this race. This file's fake script instead
// fires the callback exactly once, at a controlled moment, mirroring the
// real loader's actual (non-retrying) behavior.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");

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

// `invokeOn: "immediately"` fires the callback synchronously, as part of
// this (fake) classic script's own execution — i.e. strictly before the
// deferred app.js module runs, since that's this script's real position in
// index.html. That reproduces the buggy ordering deterministically, with no
// timing race in the test itself: it isn't a fast-vs-slow network race, it's
// the HTML spec's own classic-vs-deferred execution order, which is always
// the same. `invokeOn: "domcontentloaded"` instead waits for the
// DOMContentLoaded event, which deferred module scripts are guaranteed to
// have finished running before — modeling the (already-working) opposite
// order, equally deterministically.
function fakeIframeApiSource(invokeOn) {
  const invokeCallback = `
    if (typeof window.onYouTubeIframeAPIReady === "function") {
      window.onYouTubeIframeAPIReady();
    }
  `;
  const trigger =
    invokeOn === "immediately"
      ? invokeCallback
      : `window.addEventListener("DOMContentLoaded", function () { ${invokeCallback} });`;

  return `
    window.__playerConstructCount = 0;
    window.YT = {
      PlayerState: ${JSON.stringify(PLAYER_STATE)},
      Player: function (elementId, config) {
        window.__playerConstructCount++;
        const el = document.getElementById(elementId);
        const iframe = document.createElement("iframe");
        iframe.setAttribute("data-fake-yt-player", "true");
        el.appendChild(iframe);
        this._state = window.YT.PlayerState.UNSTARTED;
        this._muted = false;
        this.getPlayerState = function () { return this._state; };
        this.getDuration = function () { return 0; };
        this.playVideo = function () { this._state = window.YT.PlayerState.PLAYING; };
        this.stopVideo = function () { this._state = window.YT.PlayerState.ENDED; };
        this.seekTo = function () {};
        this.loadVideoById = function () {};
        this.mute = function () { this._muted = true; };
        this.unMute = function () { this._muted = false; };
        this.isMuted = function () { return this._muted; };
        // The real YT.Player always fires onReady asynchronously, well
        // after the constructor call (and the caller's own "player = new
        // YT.Player(...)" assignment) has already returned — never
        // synchronously from inside the constructor itself. Firing
        // synchronously here would read app.js's module-scoped "player"
        // before that assignment completes, a fixture inaccuracy that has
        // nothing to do with the race this file is actually testing.
        const self = this;
        if (config.events && typeof config.events.onReady === "function") {
          setTimeout(function () {
            config.events.onReady({ target: self });
          }, 0);
        }
      },
    };
    ${trigger}
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

function trackPageErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

test("the player is still constructed when the YouTube API becomes ready before app.js has run", async () => {
  const page = await browser.newPage();
  try {
    const errors = trackPageErrors(page);
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({ contentType: "application/javascript", body: fakeIframeApiSource("immediately") })
    );
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });

    await page.waitForFunction(() => window.__playerConstructCount === 1, null, { timeout: 2000 });

    const iframeCount = await page.locator("#player [data-fake-yt-player]").count();
    assert.equal(iframeCount, 1, "expected exactly one player iframe inside #player");
    assert.deepEqual(errors, [], "expected no console errors or page errors");
  } finally {
    await page.close();
  }
});

test("the player is constructed exactly once when the YouTube API becomes ready after app.js has already run", async () => {
  const page = await browser.newPage();
  try {
    const errors = trackPageErrors(page);
    await page.route("https://www.youtube.com/iframe_api", (route) =>
      route.fulfill({ contentType: "application/javascript", body: fakeIframeApiSource("domcontentloaded") })
    );
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "load" });

    await page.waitForFunction(() => window.__playerConstructCount === 1, null, { timeout: 2000 });

    const iframeCount = await page.locator("#player [data-fake-yt-player]").count();
    assert.equal(iframeCount, 1, "expected exactly one player iframe inside #player, not zero or duplicated");
    assert.deepEqual(errors, [], "expected no console errors or page errors");
  } finally {
    await page.close();
  }
});
