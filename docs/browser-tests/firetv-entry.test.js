// Guardrail for ticket #101 (Fire TV Platform App): docs/firetv.html is the
// WebView-wrapped Android app's entry page, and must never grow a Cast-to-TV
// UI — there's no Cast sender on a Fire TV remote to use it with. Checks the
// built page itself rather than trusting hand-editing discipline, the same
// reasoning as ADR-0011's hidden-elements guardrail: a future edit that
// copies index.html's cast wiring back in (e.g. a merge, or someone applying
// an unrelated index.html change platform-wide) should fail CI, not ship
// silently to a TV remote with no way to dismiss a button that can never
// work.
//
// Any future Tizen (#99) / webOS (#100) entry page should extend
// ENTRY_PAGES below rather than duplicating this test.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");
const ENTRY_PAGES = ["firetv.html"];

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

for (const page of ENTRY_PAGES) {
  test(`${page} has no Cast sender script tags`, () => {
    const html = readFileSync(path.join(DOCS_DIR, page), "utf8");
    assert.ok(
      !html.includes("cast_sender.js"),
      `${page} still loads the Cast Web Sender SDK script`,
    );
    assert.ok(
      !html.includes("cast-sender.js"),
      `${page} still loads this repo's cast-sender.js module`,
    );
  });

  test(`${page} has no #cast-button element`, () => {
    const html = readFileSync(path.join(DOCS_DIR, page), "utf8");
    assert.ok(!html.includes('id="cast-button"'), `${page} still has a #cast-button element`);
  });

  test(`${page} renders without a visible Cast affordance`, async () => {
    const browserPage = await browser.newPage();
    try {
      await browserPage.goto(`file://${path.join(DOCS_DIR, page)}`);
      const castButtonCount = await browserPage.evaluate(
        () => document.querySelectorAll("#cast-button, .btn-cast").length,
      );
      assert.equal(castButtonCount, 0, `${page} rendered a Cast button in the DOM`);
    } finally {
      await browserPage.close();
    }
  });
}
