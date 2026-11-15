// Guardrail against the bug class in ADR-0011: an element's CSS class
// setting `display` can silently outrank the browser's default
// `[hidden] { display: none }` (author styles beat the UA stylesheet
// regardless of selector specificity). `#cast-button` shipped exactly that
// way for a long time — visible on every browser, dead on ones where Cast
// never becomes available (iOS) — because nothing restated `[hidden]` for
// it, unlike `.install-hint`/`#receiver-message`/`#channel-menu-overlay`.
//
// Rather than re-testing those four known elements, this discovers every
// element any docs/*.js file toggles via `.hidden = ` (see
// find-hidden-toggles.js) and asserts the real, rendered CSS invariant for
// all of them, generically, in a real browser — so the *next* one is
// caught the same way this session caught #cast-button, not months later
// on a user's phone.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findHiddenToggledElementIds } from "./find-hidden-toggles.js";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");

function readJsSources() {
  return readdirSync(DOCS_DIR)
    .filter((filename) => filename.endsWith(".js"))
    .map((filename) => ({
      filename,
      source: readFileSync(path.join(DOCS_DIR, filename), "utf8"),
    }));
}

function htmlPagesContainingId(id) {
  return readdirSync(DOCS_DIR)
    .filter((filename) => filename.endsWith(".html"))
    .filter((filename) =>
      readFileSync(path.join(DOCS_DIR, filename), "utf8").includes(`id="${id}"`)
    );
}

const discoveredIds = findHiddenToggledElementIds(readJsSources());

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

test("discovers at least one dynamically-hidden element (sanity check on the discovery step itself)", () => {
  assert.ok(
    discoveredIds.length > 0,
    "expected to find at least one docs/*.js `.hidden = ` assignment — if this is legitimately zero, this test and find-hidden-toggles.js can be deleted"
  );
});

for (const id of discoveredIds) {
  test(`#${id}'s [hidden] attribute actually controls its rendered display`, async () => {
    const pages = htmlPagesContainingId(id);
    assert.ok(
      pages.length > 0,
      `#${id} is toggled via .hidden in JS but doesn't appear in any docs/*.html page — is the id a typo, or is a page missing from this scan?`
    );

    for (const page of pages) {
      const browserPage = await browser.newPage();
      try {
        await browserPage.goto(`file://${path.join(DOCS_DIR, page)}`);
        const result = await browserPage.evaluate((elementId) => {
          const el = document.getElementById(elementId);
          if (!el) return { found: false };
          el.hidden = true;
          const hiddenDisplay = getComputedStyle(el).display;
          el.hidden = false;
          const shownDisplay = getComputedStyle(el).display;
          return { found: true, hiddenDisplay, shownDisplay };
        }, id);

        assert.ok(result.found, `#${id} not found in the rendered DOM of ${page}`);
        assert.equal(
          result.hiddenDisplay,
          "none",
          `#${id}[hidden] computed to display:${result.hiddenDisplay} on ${page}, not none — some CSS rule outranks the UA stylesheet's [hidden] rule without restating it (see ADR-0011)`
        );
        assert.notEqual(
          result.shownDisplay,
          "none",
          `#${id} computed display:none on ${page} even without [hidden] — it can never actually be shown`
        );
      } finally {
        await browserPage.close();
      }
    }
  });
}
