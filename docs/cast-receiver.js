// Cast receiver page: plays the live broadcast when docs/cast-receiver.html
// is opened directly in a browser (ticket #37), and also when launched as an
// actual Cast session and handed a channel via a "tune" message from
// docs/cast-sender.js (ticket #39, part of spec #35). On-screen channel menu
// and remote command interception are later tickets under #35. Reuses the
// exact same shared, tested modules app.js uses for position math
// (schedule.js) and offline/error messaging (offline-message.js) so the two
// surfaces can never drift out of sync or duplicate buggy math.
import { selectLineupMessage } from "./offline-message.js";
import { t } from "./i18n-ui.js";
import { currentPosition, videosForChannel } from "./schedule.js";
import { TUNE_NAMESPACE, TUNE_MESSAGE_TYPE } from "./cast-protocol.js";

let allVideos = [];
let schedules = {};
let channelNames = [];
let currentChannel = null;
let currentVideos = [];
let currentIndex = -1;
let player = null;
let playerReady = false;

// Outcome of the most recent loadLineup() attempt — "success" or "error".
// Paired with navigator.onLine by selectLineupMessage() to decide whether
// to show the offline/error message instead of playing.
let lineupStatus = "success";

// A channel requested via a "tune" message that arrived before both the
// player and the lineup were ready to act on it — applied as soon as
// tryStartPlayback()'s own readiness check passes, in place of the default
// channel it would otherwise pick.
let pendingTuneChannel = null;

const messageEl = document.getElementById("receiver-message");

// Fetches the live lineup. Never throws — a network failure or a bad
// response is recorded in lineupStatus instead, mirroring app.js's
// loadLineup().
async function loadLineup() {
  try {
    const res = await fetch("data/videos.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`videos.json responded with ${res.status}`);
    const data = await res.json();
    allVideos = data.videos || [];
    schedules = data.schedules || {};
    channelNames = Object.keys(schedules);
    lineupStatus = "success";
  } catch (err) {
    lineupStatus = "error";
  }
}

function pickDefaultChannel() {
  if (channelNames.length === 0) return null;
  const defaultChannel = channelNames.find((name) => schedules[name] && schedules[name].default);
  return defaultChannel || channelNames[0];
}

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.hidden = false;
}

function hideMessage() {
  messageEl.hidden = true;
}

// Called once loadLineup() has settled. Shows the shared offline/error
// message when the fetch itself failed or the browser is offline;
// otherwise lets playback start.
function applyLineupState() {
  const message = selectLineupMessage({ online: navigator.onLine, status: lineupStatus });
  if (message) {
    showMessage(t(message));
    return;
  }

  tryStartPlayback();
}

// Starts playback once both halves of startup are ready: the YouTube player
// (playerReady) and a successfully-loaded lineup (lineupStatus) — same
// two-sided wait as app.js's tryStartPlayback().
function tryStartPlayback() {
  if (!playerReady) return;
  if (currentChannel !== null) return;
  if (lineupStatus !== "success") return;

  const requested = pendingTuneChannel;
  pendingTuneChannel = null;
  if (requested !== null) tuneTo(requested);
  if (currentChannel !== null) return; // the requested tune succeeded

  const defaultChannel = pickDefaultChannel();
  if (defaultChannel === null) {
    showMessage(t("nothingInLineupLabel"));
    return;
  }
  tuneTo(defaultChannel);
}

// Switches to the given channel, computing its live broadcast position
// fresh (never the position at page load) — same approach as app.js's
// switchChannel(). Silently ignored if the name doesn't match a known
// channel, same as a stale/bad "tune" message would be. Shared by
// tryStartPlayback() (the default-channel path) and tuneToChannel() (an
// incoming "tune" message), so there's exactly one place that computes
// "what's playing right now" and hands it to the player.
function tuneTo(channelName) {
  if (!channelNames.includes(channelName)) return;

  currentChannel = channelName;
  currentVideos = videosForChannel(allVideos, channelName);
  const scheduleStartMs = new Date(schedules[channelName].scheduleStart).getTime();
  const { index, offset } = currentPosition(currentVideos, scheduleStartMs);

  if (index === -1) {
    showMessage(t("nothingInLineupLabel"));
    return;
  }

  playAt(index, offset);
}

// Entry point for an incoming "tune" message. Applies it immediately once
// both the player and the lineup are ready; otherwise queues it for
// tryStartPlayback() to pick up once they are.
function tuneToChannel(channelName) {
  if (playerReady && lineupStatus === "success") {
    tuneTo(channelName);
  } else {
    pendingTuneChannel = channelName;
  }
}

function playAt(index, offsetSeconds) {
  hideMessage();
  currentIndex = index;
  const video = currentVideos[index];
  player.loadVideoById({ videoId: video.id, startSeconds: offsetSeconds });
}

// Used when a video ends or errors out mid-playback — just move on within
// the current channel, same as app.js's advanceToNext().
function advanceToNext() {
  if (currentVideos.length === 0) return;
  playAt((currentIndex + 1) % currentVideos.length, 0);
}

function onPlayerReady() {
  playerReady = true;
  tryStartPlayback();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    advanceToNext();
  }
}

// On a video load/playback error, silently advance — same philosophy as
// app.js's onPlayerError (a bad video shouldn't stall the whole broadcast).
function onPlayerError() {
  advanceToNext();
}

// Cast receivers aren't subject to normal browser autoplay-mute
// restrictions, so playback starts unmuted with no tap-to-unmute step.
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      mute: 0,
      controls: 0,
      playsinline: 1,
    },
    events: {
      onReady: onPlayerReady,
      onStateChange: onPlayerStateChange,
      onError: onPlayerError,
    },
  });
};

// Auto-recovery: when connectivity returns, reload the schedule with no
// manual refresh possible on a receiver — same as app.js's "online"
// listener (ticket #9).
window.addEventListener("online", () => {
  loadLineup().then(applyLineupState);
});

loadLineup().then(applyLineupState);

// Cast Receiver SDK wiring (ticket #39): listens for the "tune" message
// docs/cast-sender.js sends on session start, and starts the receiver
// lifecycle.
const castReceiverContext = cast.framework.CastReceiverContext.getInstance();
castReceiverContext.addCustomMessageListener(TUNE_NAMESPACE, (event) => {
  const message = event.data;
  if (!message || message.type !== TUNE_MESSAGE_TYPE) return;
  if (typeof message.channel !== "string") return;
  tuneToChannel(message.channel);
});

// Physical remote's play/pause/volume/mute (ticket #41): this receiver
// never issues its own LOAD request (tuning happens entirely via the custom
// "tune" message above), so PlayerManager has no queued media of its own to
// act on. Each interceptor below drives the YouTube IFrame Player directly,
// then calls broadcastStatus() so PlayerManager's own state (and any
// connected sender's remote-control UI) reflects the change — the
// documented pattern for a receiver whose actual playback happens outside
// PlayerManager's default media element.
const playerManager = castReceiverContext.getPlayerManager();

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.PLAY, (request) => {
  if (player) player.playVideo();
  playerManager.broadcastStatus(true);
  return request;
});

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.PAUSE, (request) => {
  if (player) player.pauseVideo();
  playerManager.broadcastStatus(true);
  return request;
});

playerManager.setMessageInterceptor(cast.framework.messages.MessageType.SET_VOLUME, (request) => {
  if (player && request.volume) {
    if (typeof request.volume.level === "number") {
      player.setVolume(Math.round(request.volume.level * 100));
    }
    if (typeof request.volume.muted === "boolean") {
      if (request.volume.muted) {
        player.mute();
      } else {
        player.unMute();
      }
    }
  }
  playerManager.broadcastStatus(true);
  return request;
});

castReceiverContext.start();
