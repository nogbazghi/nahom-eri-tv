import { test } from "node:test";
import assert from "node:assert/strict";

import { selectLineupMessage } from "./offline-message.js";

test("online + success: no message, the guide renders normally", () => {
  assert.equal(selectLineupMessage({ online: true, status: "success" }), null);
});

test("online + failure: shows an error message", () => {
  const message = selectLineupMessage({ online: true, status: "error" });
  assert.equal(typeof message, "string");
  assert.ok(message.length > 0);
});

test("offline: shows a distinct no-connection message, even if the last fetch had succeeded", () => {
  const offlineMessage = selectLineupMessage({ online: false, status: "success" });
  const onlineErrorMessage = selectLineupMessage({ online: true, status: "error" });
  assert.equal(typeof offlineMessage, "string");
  assert.ok(offlineMessage.length > 0);
  assert.notEqual(offlineMessage, onlineErrorMessage);
});

test("recovered: coming back online and successfully reloading clears the message", () => {
  const whileOffline = selectLineupMessage({ online: false, status: "error" });
  const afterRecovery = selectLineupMessage({ online: true, status: "success" });
  assert.notEqual(whileOffline, null);
  assert.equal(afterRecovery, null);
});
