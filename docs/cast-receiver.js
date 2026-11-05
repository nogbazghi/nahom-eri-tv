// Standalone Cast receiver page (ticket #37, part of spec #35): plays the
// live broadcast correctly when docs/cast-receiver.html is opened directly
// in a browser, with no Cast session plumbing yet (no "tune" message
// handling, no on-screen channel menu, no remote command interception —
// those are later tickets under #35). Reuses the exact same shared, tested
// modules app.js uses for position math (schedule.js) and offline/error
// messaging (offline-message.js) so the two surfaces can never drift out of
// sync or duplicate buggy math.
import { selectLineupMessage } from "./offline-message.js";
import { t } from "./i18n-ui.js";
import { currentPosition, videosForChannel } from "./schedule.js";

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

  currentChannel = pickDefaultChannel();
  if (currentChannel === null) {
    showMessage(t("nothingInLineupLabel"));
    return;
  }

  currentVideos = videosForChannel(allVideos, currentChannel);
  const scheduleStartMs = new Date(schedules[currentChannel].scheduleStart).getTime();
  const { index, offset } = currentPosition(currentVideos, scheduleStartMs);

  if (index === -1) {
    showMessage(t("nothingInLineupLabel"));
    return;
  }

  playAt(index, offset);
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

loadLineup().then(applyLineupState);
