import { test } from "node:test";
import assert from "node:assert/strict";

import { isChannelAvailable } from "./channel-availability.js";

test("empty video list: channel is not available", () => {
  assert.equal(isChannelAvailable([]), false);
});

test("one or more videos: channel is available", () => {
  assert.equal(isChannelAvailable([{ id: "abc123" }]), true);
});
