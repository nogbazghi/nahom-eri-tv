import { test } from "node:test";
import assert from "node:assert/strict";

import { selectLineupMessage, LINEUP_FAILURE_MESSAGE_KEY } from "./offline-message.js";

test("online + success: no message, the guide renders normally", () => {
  assert.equal(selectLineupMessage({ online: true, status: "success" }), null);
});

test("online + failure: shows the shared failure message's translation key", () => {
  const message = selectLineupMessage({ online: true, status: "error" });
  assert.equal(message, LINEUP_FAILURE_MESSAGE_KEY);
});

test("offline: shows the same shared failure message, even if the last fetch had succeeded — per spec issue #7, every failure cause reads the same to a visitor", () => {
  const offlineMessage = selectLineupMessage({ online: false, status: "success" });
  const onlineErrorMessage = selectLineupMessage({ online: true, status: "error" });
  assert.equal(offlineMessage, LINEUP_FAILURE_MESSAGE_KEY);
  assert.equal(offlineMessage, onlineErrorMessage);
});

test("recovered: coming back online and successfully reloading clears the message", () => {
  const whileOffline = selectLineupMessage({ online: false, status: "error" });
  const afterRecovery = selectLineupMessage({ online: true, status: "success" });
  assert.notEqual(whileOffline, null);
  assert.equal(afterRecovery, null);
});
