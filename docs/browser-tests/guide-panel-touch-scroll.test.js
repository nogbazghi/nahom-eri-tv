// Regression guardrail for ADR-0017: a vertical touch gesture over the open
// guide panel must scroll the page the way any ordinary mobile page scrolls,
// not get intercepted the way the removed swipe-paging gesture used to
// (ticket #133, part of spec #131). Asserts the externally observable
// outcome (does the page's scroll position actually move) rather than an
// implementation detail like "was preventDefault() called" — the latter
// would pass even if some other new bug reintroduced non-scrolling by a
// different mechanism.
//
// Dispatches touch input through the CDP `Input.dispatchTouchEvent` call
// (the same mechanism Playwright's own touchscreen API uses under the
// hood), not a JS-dispatched TouchEvent — Chromium's native touch-scroll is
// driven by its input pipeline reacting to real/CDP input, not by a
// `dispatchEvent()` call a page script makes on itself.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");
const VIEWPORT = { width: 390, height: 700 };

let browser;
before(async () => {
  // Chromium treats each file:// URL as its own opaque origin, which blocks
  // app.js's `type="module"` script load under plain file:// navigation
  // (a classic <script> wouldn't hit this; a module's load goes through
  // fetch's CORS check). This flag is the documented escape hatch for
  // file:// pages loading other file:// resources.
  browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
});
after(async () => {
  await browser.close();
});

async function swipeVertically(page, { x, startY, endY, steps = 8 }) {
  const client = await page.context().newCDPSession(page);
  const point = (y) => ({ x, y, id: 1 });

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(startY)],
  });

  for (let i = 1; i <= steps; i++) {
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(startY + ((endY - startY) * i) / steps)],
    });
  }

  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}

test("a vertical touch gesture over the open guide panel scrolls the page", async () => {
  const context = await browser.newContext({ viewport: VIEWPORT, hasTouch: true });
  const page = await context.newPage();

  try {
    await page.goto(`file://${path.join(DOCS_DIR, "index.html")}`);
    await page.click("#guide-toggle");

    // channelNames is empty under file:// (fetch("data/videos.json") never
    // resolves there), so renderGuide() alone produces no real rows — inject
    // enough synthetic ones to overflow one viewport, independent of
    // however many real channels happen to be curated on a given day.
    await page.evaluate(() => {
      const guideRows = document.getElementById("guide-rows");
      for (let i = 0; i < 60; i++) {
        const row = document.createElement("div");
        row.className = "guide-row";
        row.style.height = "60px";
        row.textContent = `Synthetic channel ${i}`;
        guideRows.appendChild(row);
      }
    });

    const panelBox = await page.locator("#guide-panel").boundingBox();
    assert.ok(panelBox, "#guide-panel should be visible (not [hidden]) once the guide is open");

    const beforeScroll = await page.evaluate(() => window.scrollY);

    await swipeVertically(page, {
      x: panelBox.x + panelBox.width / 2,
      startY: Math.min(panelBox.y + panelBox.height - 20, VIEWPORT.height - 10),
      endY: panelBox.y + 20,
    });

    const afterScroll = await page.evaluate(() => window.scrollY);
    assert.notEqual(
      afterScroll,
      beforeScroll,
      "swiping over the open guide panel should scroll the page natively"
    );
  } finally {
    await context.close();
  }
});
