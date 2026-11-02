import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldShowIosInstallHint, detectIsIOS, detectIsStandalone } from "./ios-install-hint.js";

test("shows the hint on iOS Safari, not standalone, not dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: true, isStandalone: false, dismissed: false }),
    true,
  );
});

test("hides the hint on iOS when already running standalone, not dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: true, isStandalone: true, dismissed: false }),
    false,
  );
});

test("hides the hint on iOS, not standalone, but previously dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: true, isStandalone: false, dismissed: true }),
    false,
  );
});

test("hides the hint on iOS when standalone AND dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: true, isStandalone: true, dismissed: true }),
    false,
  );
});

test("hides the hint on non-iOS, not standalone, not dismissed (Android/desktop rely on the native prompt)", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: false, isStandalone: false, dismissed: false }),
    false,
  );
});

test("hides the hint on non-iOS when standalone, not dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: false, isStandalone: true, dismissed: false }),
    false,
  );
});

test("hides the hint on non-iOS, not standalone, dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: false, isStandalone: false, dismissed: true }),
    false,
  );
});

test("hides the hint on non-iOS when standalone AND dismissed", () => {
  assert.equal(
    shouldShowIosInstallHint({ isIOS: false, isStandalone: true, dismissed: true }),
    false,
  );
});

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const IPAD_LEGACY_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
const IPADOS_DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15";
const REAL_MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/118.0 Safari/537.36";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/118.0 Mobile Safari/537.36";

test("detectIsIOS: true for iPhone UA", () => {
  assert.equal(detectIsIOS(IPHONE_UA, 0), true);
});

test("detectIsIOS: true for legacy iPad UA", () => {
  assert.equal(detectIsIOS(IPAD_LEGACY_UA, 5), true);
});

test("detectIsIOS: true for iPadOS 13+ masquerading as Macintosh with touch points", () => {
  assert.equal(detectIsIOS(IPADOS_DESKTOP_UA, 5), true);
});

test("detectIsIOS: false for a real Mac (Macintosh UA, no touch points)", () => {
  assert.equal(detectIsIOS(REAL_MAC_UA, 0), false);
});

test("detectIsIOS: false for Android", () => {
  assert.equal(detectIsIOS(ANDROID_UA, 5), false);
});

test("detectIsIOS: false for empty/undefined UA", () => {
  assert.equal(detectIsIOS(undefined, 0), false);
});

test("detectIsStandalone: true when navigator.standalone is true", () => {
  assert.equal(detectIsStandalone(true, false), true);
});

test("detectIsStandalone: true when display-mode media query matches", () => {
  assert.equal(detectIsStandalone(false, true), true);
});

test("detectIsStandalone: true when both signal standalone", () => {
  assert.equal(detectIsStandalone(true, true), true);
});

test("detectIsStandalone: false when neither signals standalone", () => {
  assert.equal(detectIsStandalone(false, false), false);
});

test("detectIsStandalone: false for undefined navigator.standalone (non-iOS) and no media match", () => {
  assert.equal(detectIsStandalone(undefined, false), false);
});
