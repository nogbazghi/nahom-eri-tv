// Regression guardrail for ticket #163 (spec #158): the Player overlays
// (Corner badge, Overlay controls) used to be sized in fixed rem values with
// no mobile responsiveness, so on a narrow phone they occupied a
// disproportionately large share of the video frame and obstructed the
// video itself. This asserts the externally observable sizing contract — a
// legibility floor shared across the overlays, today's current sizes as the
// ceiling, an untouched touch-target floor, and the Corner badge title's
// single-line truncation — at a real rendered DOM, not by inspecting the
// CSS rules as text (which would pass even if some later change made the
// rule present but non-effective, e.g. outranked by specificity or a typo
// in the custom property name).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");

const MOBILE_VIEWPORT = { width: 375, height: 700 };
const DESKTOP_VIEWPORT = { width: 1200, height: 800 };

// Today's current (desktop/ceiling) font-sizes, in rem, for each overlay
// element — see docs/style.css. `.name` is already at the legibility floor
// today, so it has no room left to shrink further.
const CEILING_REM = {
  num: 1.6,
  name: 0.68,
  title: 0.82,
  unmute: 0.85,
  goLive: 0.85,
};
const FLOOR_REM = 0.68;
const ROOT_FONT_SIZE_PX = 16; // :root never redefines font-size — 1rem is always 16px

function remToPx(rem) {
  return rem * ROOT_FONT_SIZE_PX;
}

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

async function openPlayerPage(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(`file://${path.join(DOCS_DIR, "index.html")}`);
  // Under file://, app.js never populates the badge from real data (its
  // fetch() calls never resolve) — set known content directly so the
  // geometry assertions below (especially title truncation) exercise real
  // rendered text rather than empty elements.
  await page.evaluate(() => {
    document.getElementById("badge-num").textContent = "7";
    document.getElementById("badge-name").textContent = "Fenkil";
    document.getElementById("badge-title").textContent =
      "A deliberately very long video title, long enough to overflow the Corner badge's max-width on any viewport this test uses";
    document.getElementById("go-live").disabled = false;
  });
  return { context, page };
}

async function computedFontSizePx(page, selector) {
  return page.$eval(selector, (el) => parseFloat(getComputedStyle(el).fontSize));
}

// Opens the player page at both reference viewports, runs `fn({ mobile,
// desktop })`, and always closes both contexts afterward — shared by the
// two tests below that compare the same element across both widths.
async function withMobileAndDesktop(fn) {
  const mobile = await openPlayerPage(MOBILE_VIEWPORT);
  const desktop = await openPlayerPage(DESKTOP_VIEWPORT);
  try {
    await fn({ mobile, desktop });
  } finally {
    await mobile.context.close();
    await desktop.context.close();
  }
}

test("Corner badge and Overlay control font-sizes stay within the legibility floor and today's ceiling, and shrink on a phone", async () => {
  await withMobileAndDesktop(async ({ mobile, desktop }) => {
    const selectors = {
      num: "#corner-badge .num",
      name: "#corner-badge .name",
      title: "#badge-title",
      unmute: "#unmute",
      goLive: "#go-live",
    };

    for (const [key, selector] of Object.entries(selectors)) {
      const mobilePx = await computedFontSizePx(mobile.page, selector);
      const desktopPx = await computedFontSizePx(desktop.page, selector);
      const ceilingPx = remToPx(CEILING_REM[key]);
      const floorPx = remToPx(FLOOR_REM);

      assert.ok(
        mobilePx >= floorPx - 0.5 && mobilePx <= ceilingPx + 0.5,
        `${selector} at 375px: expected font-size between ${floorPx}px and ${ceilingPx}px, got ${mobilePx}px`
      );
      assert.ok(
        desktopPx >= floorPx - 0.5 && desktopPx <= ceilingPx + 0.5,
        `${selector} at desktop width: expected font-size between ${floorPx}px and ${ceilingPx}px, got ${desktopPx}px`
      );
      assert.ok(
        Math.abs(desktopPx - ceilingPx) <= 0.5,
        `${selector} at desktop width should render at today's current ceiling size (${ceilingPx}px), got ${desktopPx}px`
      );

      if (CEILING_REM[key] > FLOOR_REM) {
        assert.ok(
          mobilePx < desktopPx - 0.5,
          `${selector} should be visibly smaller at 375px (${mobilePx}px) than at desktop width (${desktopPx}px)`
        );
      } else {
        // Already at the floor today (.name) — nowhere left to shrink.
        assert.ok(
          Math.abs(mobilePx - desktopPx) <= 0.5,
          `${selector} is already at the legibility floor and shouldn't change between viewports`
        );
      }
    }
  });
});

test("Overlay controls never shrink below the 44px touch-target floor, on a phone or desktop", async () => {
  await withMobileAndDesktop(async ({ mobile, desktop }) => {
    for (const selector of ["#unmute", "#go-live"]) {
      for (const { page, label } of [
        { page: mobile.page, label: "375px" },
        { page: desktop.page, label: "desktop width" },
      ]) {
        const height = await page.$eval(selector, (el) => el.getBoundingClientRect().height);
        assert.ok(
          height >= 44,
          `${selector} at ${label}: expected rendered height >= 44px, got ${height}px`
        );
      }
    }
  });
});

test("an overlong Corner badge title truncates to one line instead of wrapping, on a phone", async () => {
  const { context, page } = await openPlayerPage(MOBILE_VIEWPORT);

  try {
    const { scrollWidth, clientWidth, scrollHeight, clientHeight } = await page.$eval(
      "#badge-title",
      (el) => ({
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      })
    );

    assert.ok(
      scrollWidth > clientWidth,
      `expected the long title to overflow its box width (scrollWidth ${scrollWidth} > clientWidth ${clientWidth}) — otherwise this test isn't actually exercising truncation`
    );
    assert.ok(
      scrollHeight <= clientHeight + 1,
      `#badge-title's content overflowed vertically (scrollHeight ${scrollHeight} vs clientHeight ${clientHeight}) — it should wrap to at most one line, not grow taller`
    );
  } finally {
    await context.close();
  }
});
