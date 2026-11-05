import { test } from "node:test";
import assert from "node:assert/strict";

import { TUNE_MESSAGE_TYPE, tuneMessage } from "./cast-protocol.js";

test("tuneMessage: builds a tune message for the given channel", () => {
  assert.deepEqual(tuneMessage("News"), { type: TUNE_MESSAGE_TYPE, channel: "News" });
});
