// Guardrail for ticket #99 (part of spec #98): the Tizen entry page must
// never load the Google Cast sender scripts or show #cast-button, since the
// TV itself is the Cast destination, not a sender. Asserted against the
// real rendered page in a real browser, following ADR-0011's pattern
// (hidden-elements.test.js) rather than a static HTML/text scan — a regression
// here (e.g. someone copy-pasting index.html's <head>/toolbar back in) should
// fail the same way a cascade regression does.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DOCS_DIR = path.resolve(fileURLToPath(import.meta.url), "../..");
const ENTRY_PAGE = path.join(DOCS_DIR, "tizen-entry.html");

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser.close();
});

test("tizen-entry.html never loads the Google Cast sender scripts", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`file://${ENTRY_PAGE}`);
    const scriptSrcs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("script[src]")).map((el) => el.getAttribute("src")),
    );
    const castScripts = scriptSrcs.filter(
      (src) => src.includes("cast_sender.js") || src.includes("cast-sender.js"),
    );
    assert.deepEqual(
      castScripts,
      [],
      `expected no Cast-sender script tags on the Tizen entry page, found: ${castScripts.join(", ")}`,
    );
  } finally {
    await page.close();
  }
});

test("tizen-entry.html never shows #cast-button", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`file://${ENTRY_PAGE}`);
    const castButton = await page.evaluate(() => {
      const el = document.getElementById("cast-button");
      if (!el) return { present: false };
      return { present: true, display: getComputedStyle(el).display };
    });
    assert.equal(
      castButton.present,
      false,
      "expected #cast-button to not exist on the Tizen entry page (the TV itself is the Cast destination, not a sender)",
    );
  } finally {
    await page.close();
  }
});
