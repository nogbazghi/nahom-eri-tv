// Cast sender (ticket #39/#40, part of spec #35): lets the phone/laptop
// launch the registered Cast receiver (docs/cast-receiver.html, built in
// #37) and hand it off the channel that's showing locally, at the live
// broadcast position. Kept separate from app.js, which stays entirely
// ignorant of the Cast Framework itself — the two only talk via events:
// app.js dispatches "neritv:channel" on every local channel switch and
// "neritv:tune-request"/"neritv:stop-casting" from its remote-view
// controls; this module dispatches "neritv:cast-session" whenever a
// session starts, resumes, or ends, which is what tells app.js to swap
// into (or out of) the remote-view UI.
//
// Not unit-testable: this is Cast Framework session-lifecycle wiring, which
// only runs against a real Cast-capable browser and a real or emulated
// receiver (see spec #35's Testing Decisions). Verified manually.
import { TUNE_NAMESPACE, tuneMessage } from "./cast-protocol.js";

// Registered in the Google Cast Developer Console by ticket #38 (a one-time
// human step — see docs/agents for context). #38 is not done yet as of this
// ticket, so this is a placeholder: swap in the real App ID once #38
// completes, and this file's behavior needs no other changes.
const RECEIVER_APP_ID = "YOUR_CAST_APP_ID";

const castButton = document.getElementById("cast-button");

// The channel currently showing locally, kept in sync via app.js's
// "neritv:channel" event — not read from app.js directly, so this module
// has no import-time dependency on app.js at all.
let latestChannel = null;

window.addEventListener("neritv:channel", (event) => {
  latestChannel = event.detail.channel;
});

function sendTuneMessage() {
  if (latestChannel === null) return; // nothing showing locally yet to hand off
  const session = cast.framework.CastContext.getInstance().getCurrentSession();
  if (!session) return;
  session.sendMessage(TUNE_NAMESPACE, tuneMessage(latestChannel));
}

// Tells app.js whether a Cast session is active, and the device's friendly
// name while it is, so app.js can swap its UI into (or out of) the remote
// view (ticket #40) without this module knowing anything about that UI.
function dispatchCastSessionEvent(active, deviceName) {
  window.dispatchEvent(
    new CustomEvent("neritv:cast-session", { detail: { active, deviceName: deviceName || null } })
  );
}

function initializeCastApi() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: RECEIVER_APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });

  cast.framework.CastContext.getInstance().addEventListener(
    cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
    (event) => {
      if (
        event.sessionState === cast.framework.SessionState.SESSION_STARTED ||
        event.sessionState === cast.framework.SessionState.SESSION_RESUMED
      ) {
        sendTuneMessage();
        const session = cast.framework.CastContext.getInstance().getCurrentSession();
        const deviceName = session && session.getCastDevice() ? session.getCastDevice().friendlyName : null;
        dispatchCastSessionEvent(true, deviceName);
      } else if (event.sessionState === cast.framework.SessionState.SESSION_ENDED) {
        dispatchCastSessionEvent(false, null);
      }
    }
  );

  // Sent by app.js's remote-view channel switcher (ticket #40) — it's
  // already updated latestChannel via "neritv:channel" by the time this
  // fires (both are dispatched synchronously from the same click handler),
  // so sendTuneMessage() here picks up the newly-picked channel.
  window.addEventListener("neritv:tune-request", () => {
    sendTuneMessage();
  });

  // Sent by app.js's "Stop Casting" control (ticket #40). Passing `true`
  // stops the receiver app too, rather than just disconnecting the sender
  // and leaving it running. The resulting SESSION_ENDED state change above
  // is what actually tells app.js to resume local playback.
  window.addEventListener("neritv:stop-casting", () => {
    cast.framework.CastContext.getInstance().endCurrentSession(true);
  });

  castButton.hidden = false;
  castButton.addEventListener("click", () => {
    // Rejects on a cancelled device picker or a failed connection — nothing
    // to do either way, the button just stays available to try again.
    cast.framework.CastContext.getInstance().requestSession().catch(() => {});
  });
}

// Called by the Cast Sender SDK once it's loaded (see the script tag in
// index.html) with whether this browser/device supports casting at all.
// Browsers with no Cast support (e.g. Safari, Firefox, iOS Chrome) either
// never call this back or call it with isAvailable === false — either way
// #cast-button stays hidden (its default state in index.html) and nothing
// else in this file runs.
window["__onGCastApiAvailable"] = function (isAvailable) {
  if (isAvailable) {
    initializeCastApi();
  }
};
