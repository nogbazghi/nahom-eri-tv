// Regression test for the __onGCastApiAvailable readiness race (see
// waitForCastFrameworkThenInitialize in cast-sender.js): the Cast Sender SDK
// can call back with isAvailable === true once `chrome.cast` is ready,
// before the separate `?loadCastFramework=1` fetch has attached `cast`
// (CAF) — hitting that gap used to throw "ReferenceError: cast is not
// defined" out of the callback and leave #cast-button stuck hidden.
//
// cast-sender.js is a browser module with top-level side effects (it reads
// `document.getElementById` and installs `window.__onGCastApiAvailable` at
// import time), so each test below fakes the host globals it reads and
// imports a fresh module instance via a cache-busting query string.
import { test } from "node:test";
import assert from "node:assert/strict";

function fakeCastButton() {
  return { hidden: true, disabled: true, addEventListener() {} };
}

// window === globalThis in every real browser, which is what lets the
// module's bare `cast.framework` references (resolved as globals) and its
// `window.cast` readiness check (see waitForCastFrameworkThenInitialize)
// see the same object. Mirror that here instead of faking a separate
// window, or the two would disagree in a way a real browser never would.
async function loadFresh(tag) {
  const castButton = fakeCastButton();
  const events = new EventTarget();
  globalThis.document = {
    getElementById(id) {
      return id === "cast-button" ? castButton : null;
    },
  };
  globalThis.addEventListener = events.addEventListener.bind(events);
  globalThis.removeEventListener = events.removeEventListener.bind(events);
  globalThis.dispatchEvent = events.dispatchEvent.bind(events);
  globalThis.window = globalThis;
  delete globalThis.cast;
  delete globalThis.chrome;

  await import(`./cast-sender.js?case=${tag}`);

  return { castButton, window: globalThis.window };
}

test("recovers when cast.framework attaches shortly after isAvailable fires", async () => {
  const { castButton, window } = await loadFresh("recovers");

  // Simulate chrome.cast being ready now, cast.framework arriving 20ms later.
  window.__onGCastApiAvailable(true);
  assert.equal(castButton.hidden, true, "must not throw synchronously, and must not init before cast.framework exists");

  await new Promise((resolve) => setTimeout(resolve, 20));
  globalThis.chrome = { cast: { AutoJoinPolicy: { ORIGIN_SCOPED: "origin_scoped" } } };
  globalThis.cast = {
    framework: {
      CastContext: { getInstance: () => ({ setOptions() {}, addEventListener() {}, getCurrentSession: () => null }) },
      CastContextEventType: { SESSION_STATE_CHANGED: "sessionstatechanged" },
    },
  };

  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(castButton.hidden, false, "initializeCastApi should have run once cast.framework appeared");

  delete globalThis.cast;
  delete globalThis.chrome;
});

test("degrades gracefully (no throw, button stays hidden) when cast.framework never attaches", async () => {
  const { castButton } = await loadFresh("never-attaches");

  assert.doesNotThrow(() => {
    globalThis.window.__onGCastApiAvailable(true);
  });

  await new Promise((resolve) => setTimeout(resolve, 1200));
  assert.equal(castButton.hidden, true);
});

// Ticket #73: a session started before any channel is picked locally used to
// reach enterCastingView() with a blank channel name, since latestChannel
// was still null. Gating the button's `disabled` state on a real channel
// arriving (not just any "neritv:channel" dispatch — tuneLiveEvent() sends
// one with a null channel too) keeps that path unreachable.
test("#cast-button stays disabled until app.js reports a real channel", async () => {
  const { castButton, window } = await loadFresh("disabled-until-channel");

  assert.equal(castButton.disabled, true, "disabled by default, before any channel is picked");

  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: null } }));
  assert.equal(castButton.disabled, true, "a null channel (e.g. a Live event) must not enable it");

  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: "ChannelA" } }));
  assert.equal(castButton.disabled, false, "enabled once a real channel is picked");
});

test("#cast-button stays enabled afterwards, even if a later event reports a null channel", async () => {
  const { castButton, window } = await loadFresh("stays-enabled");

  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: "ChannelA" } }));
  assert.equal(castButton.disabled, false);

  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: null } }));
  assert.equal(castButton.disabled, false, "a later Live event tune must not re-disable it");
});
