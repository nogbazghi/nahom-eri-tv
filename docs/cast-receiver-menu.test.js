import { test } from "node:test";
import assert from "node:assert/strict";

import { createReceiverChannelMenu } from "./cast-receiver-menu.js";

class FakeTarget {
  listeners = new Map();

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) || []) {
      listener({
        preventDefault() {},
        ...event,
      });
    }
  }
}

class FakeElement extends FakeTarget {
  children = [];
  dataset = {};
  attributes = new Map();
  hidden = false;
  className = "";
  document;
  #textContent = "";

  constructor(document) {
    super();
    this.document = document;
  }

  set textContent(value) {
    this.#textContent = value;
    this.children = [];
  }

  get textContent() {
    return this.#textContent;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  focus() {
    this.document.activeElement = this;
  }
}

function createHarness({
  currentChannel = "News",
  player = null,
  onSelectChannel = () => {},
} = {}) {
  const document = new FakeTarget();
  document.activeElement = null;
  document.createElement = () => new FakeElement(document);

  const menuOverlay = new FakeElement(document);
  menuOverlay.hidden = true;
  const channelList = new FakeElement(document);
  const menuToggle = new FakeElement(document);

  const menu = createReceiverChannelMenu({
    document,
    menuOverlay,
    channelList,
    menuToggle,
    getCurrentChannel: () => currentChannel,
    getPlayer: () => player,
    onSelectChannel,
  });

  return { document, menuOverlay, channelList, menuToggle, menu };
}

test("receiver menu shows scheduled channels and focuses the current available channel", () => {
  const { document, menuOverlay, channelList, menuToggle, menu } = createHarness({
    currentChannel: "Sports",
  });

  menu.render([
    { name: "News", available: true },
    { name: "Catholic", available: false },
    { name: "Sports", available: true },
  ]);
  menuToggle.dispatch("click");

  assert.equal(menuOverlay.hidden, false);
  assert.deepEqual(channelList.children.map((item) => item.textContent), ["News", "Catholic", "Sports"]);
  assert.equal(channelList.children[1].getAttribute("aria-disabled"), "true");
  assert.equal(document.activeElement, channelList.children[2]);
});

test("receiver menu stays unavailable when the lineup has no channels", () => {
  const { document, menuOverlay, menuToggle, menu } = createHarness();

  menu.render([]);
  document.dispatch("keydown", { key: "ArrowDown" });

  assert.equal(menuToggle.hidden, true);
  assert.equal(menuOverlay.hidden, true);
});

test("remote opens the menu, navigates available channels, and selects the focused channel", () => {
  const selectedChannels = [];
  const { document, menuOverlay, channelList, menu } = createHarness({
    onSelectChannel: (name) => selectedChannels.push(name),
  });

  menu.render([
    { name: "News", available: true },
    { name: "Catholic", available: false },
    { name: "Sports", available: true },
  ]);
  document.dispatch("keydown", { key: "ArrowUp" });
  document.dispatch("keydown", { key: "ArrowDown" });
  document.dispatch("keydown", { key: "Enter" });

  assert.deepEqual(selectedChannels, ["Sports"]);
  assert.equal(menuOverlay.hidden, true);
});

test("touch swipes navigate and select channels in the open menu", () => {
  const selectedChannels = [];
  const { menuOverlay, channelList, menuToggle, menu } = createHarness({
    onSelectChannel: (name) => selectedChannels.push(name),
  });

  menu.render([
    { name: "News", available: true },
    { name: "Sports", available: true },
  ]);
  menuToggle.dispatch("click");
  menuOverlay.dispatch("touchstart", {
    touches: [{ clientX: 100, clientY: 160 }],
  });
  menuOverlay.dispatch("touchend", {
    changedTouches: [{ clientX: 100, clientY: 100 }],
  });
  menuOverlay.dispatch("touchstart", {
    touches: [{ clientX: 100, clientY: 100 }],
  });
  menuOverlay.dispatch("touchend", {
    changedTouches: [{ clientX: 160, clientY: 100 }],
  });

  assert.deepEqual(selectedChannels, ["Sports"]);
  assert.equal(menuOverlay.hidden, true);
  assert.equal(channelList.children[1].textContent, "Sports");
});

test("remote left and right seek by ten seconds only while the menu is closed", () => {
  const seeks = [];
  const player = {
    getCurrentTime: () => 5,
    seekTo: (...args) => seeks.push(args),
  };
  const { document, menuToggle, menu } = createHarness({ player });

  menu.render([{ name: "News", available: true }]);
  document.dispatch("keydown", { key: "ArrowLeft" });
  document.dispatch("keydown", { key: "ArrowRight" });
  menuToggle.dispatch("click");
  document.dispatch("keydown", { key: "ArrowLeft" });

  assert.deepEqual(seeks, [
    [0, true],
    [15, true],
  ]);
});

test("the Channels button toggles the menu and tapping an available channel tunes it", () => {
  const selectedChannels = [];
  const { document, menuOverlay, channelList, menuToggle, menu } = createHarness({
    onSelectChannel: (name) => selectedChannels.push(name),
  });

  menu.render([
    { name: "News", available: true },
    { name: "Catholic", available: false },
    { name: "Sports", available: true },
  ]);
  menuToggle.dispatch("click");
  assert.equal(menuToggle.getAttribute("aria-expanded"), "true");
  channelList.children[2].dispatch("click");

  assert.deepEqual(selectedChannels, ["Sports"]);
  assert.equal(menuOverlay.hidden, true);
  assert.equal(menuToggle.getAttribute("aria-expanded"), "false");

  menuToggle.dispatch("click");
  menuToggle.dispatch("click");
  assert.equal(menuOverlay.hidden, true);

  menuToggle.dispatch("click");
  document.dispatch("keydown", { key: "Escape" });
  assert.equal(menuOverlay.hidden, true);
});
