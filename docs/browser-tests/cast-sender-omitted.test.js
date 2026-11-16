// Guardrail (spec #98, ticket #100): a TV Platform App's hosted entry page
// must never load the Cast sender scripts or show #cast-button, since the
// TV itself is already the Cast destination, not a device you'd cast away
// from. Follows ADR-0011's pattern (hidden-elements.test.js): a real
// Chromium page load, not a static HTML/text scan, so this asserts what
// actually renders rather than reimplementing the check by hand.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { TV_PLATFORM_ENTRY_PAGES } from "./tv-platform-entry-pages.js";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

for (const page of TV_PLATFORM_ENTRY_PAGES) {
  test(`${page} never loads the Cast sender scripts or shows #cast-button`, async () => {
    const browserPage = await browser.newPage();
    try {
      await browserPage.goto(`file://${path.join(DOCS_DIR, page)}`);
      const result = await browserPage.evaluate(() => ({
        scriptSrcs: Array.from(document.querySelectorAll("script[src]")).map((s) => s.src),
        hasCastButton: document.getElementById("cast-button") !== null,
      }));

      const castSenderScripts = result.scriptSrcs.filter(
        (src) => src.includes("cast_sender.js") || src.includes("cast-sender.js"),
      );
      assert.deepEqual(
        castSenderScripts,
        [],
        `${page} loaded Cast sender script(s): ${castSenderScripts.join(", ")}`,
      );
      assert.equal(result.hasCastButton, false, `${page} renders #cast-button`);
    } finally {
      await browserPage.close();
    }
  });
}
