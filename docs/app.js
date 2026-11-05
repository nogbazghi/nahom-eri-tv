import { selectLineupMessage } from "./offline-message.js";
import { t, onLanguageChange } from "./i18n-ui.js";
import {
  currentPosition,
  videosForChannel as videosForChannelPure,
  channelNowState as channelNowStatePure,
} from "./schedule.js";
import { isChannelAvailable } from "./channel-availability.js";

let allVideos = [];
let schedules = {};
let channelNames = [];
let currentChannel = null;
let currentVideos = [];
let player = null;
let currentIndex = -1;
let guideOpen = false;
let playerReady = false;
// True while a Cast session is active and the remote view (#casting-view)
// is showing in place of the local player/guide (ticket #40, part of spec
// #35) — set/cleared by the "neritv:cast-session" listener near the bottom
// of this file, which cast-sender.js dispatches on session start/end.
let casting = false;
// True while the "Nothing in the lineup yet" empty state (showEmptyState())
// is the badge's current content — tracked so a language toggle can
// re-render it correctly without guessing from other state. Cleared the
// moment real playback starts (playAt()).
let lineupEmpty = false;

// Outcome of the most recent loadLineup() attempt — "success" or "error".
// Paired with navigator.onLine by selectLineupMessage() (see
// offline-message.js) to decide what, if anything, replaces the guide.
let lineupStatus = "success";
// The message currently shown in place of the guide, or null when the real
// schedule is showing. Mirrors scheduleMessageEl so renderGuide() etc. can
// check it without reading back from the DOM.
let scheduleMessage = null;

const CHANNEL_DOT_COLORS = ["var(--accent)", "var(--kebire)", "#9a7fd1", "#d97757"];

// Drives focus through the guide's channel rows — see nav.js. Keyboard and
// touch (swipe) are the two input sources wired up so far; a later TV-stick
// remote feeds the same move()/activate() calls from its own input events.
const guideNav = createListNav({
  getItems: () =>
    Array.from(guideRows.querySelectorAll(".guide-row")).filter(
      (row) => row.getAttribute("aria-disabled") !== "true",
    ),
  onActivate: (row) => switchChannel(row.dataset.channel),
});

const playerWrap = document.getElementById("player-wrap");
const badgeNum = document.getElementById("badge-num");
const badgeName = document.getElementById("badge-name");
const badgeTitle = document.getElementById("badge-title");
const unmuteButton = document.getElementById("unmute");
const goLiveButton = document.getElementById("go-live");
const guidePanel = document.getElementById("guide-panel");
const guideRows = document.getElementById("guide-rows");
const guideToggle = document.getElementById("guide-toggle");
const toolbarChan = document.getElementById("toolbar-chan");
const scheduleMessageEl = document.getElementById("schedule-message");
const localView = document.getElementById("local-view");
const castingView = document.getElementById("casting-view");
const castingDeviceNameEl = document.getElementById("casting-device-name");
const castingChannelNameEl = document.getElementById("casting-channel-name");
const castingChannelList = document.getElementById("casting-channel-list");
const stopCastingButton = document.getElementById("stop-casting");

function slug(name) {
  return name.toLowerCase();
}

// Fetches the live lineup. Never throws — a network failure or a bad
// response is recorded in lineupStatus instead, so callers always continue
// on to applyLineupState() rather than leaving an unhandled rejection (see
// ticket #9). data/videos.json is the live, actively-curated broadcast
// schedule (ADR-0002) — fetched with no-store and never retried with stale
// data on failure.
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

// Called after every loadLineup() attempt — the initial one and every retry
// triggered by the "online" listener below. Decides, via the pure
// selectLineupMessage() (connectivity + lineupStatus in, message or null
// out), whether to show the offline/error state or let playback proceed.
function applyLineupState() {
  scheduleMessage = selectLineupMessage({ online: navigator.onLine, status: lineupStatus });
  renderScheduleMessage();

  if (scheduleMessage) return; // nothing to play until this clears

  tryStartPlayback();
  if (guideOpen) renderGuide(); // refresh an already-open guide after a retry
}

// scheduleMessage holds a docs/i18n.js translation *key* (see
// offline-message.js's LINEUP_FAILURE_MESSAGE_KEY), not display text — it's
// resolved to the active language's string here, at render time, so it
// stays correct across a language toggle with no re-fetch needed.
function renderScheduleMessage() {
  scheduleMessageEl.textContent = scheduleMessage ? t(scheduleMessage) : "";
  scheduleMessageEl.hidden = !scheduleMessage;
}

// Starts playback once both halves of startup are ready: the YouTube player
// (playerReady, via onPlayerReady) and a successfully-loaded lineup
// (lineupStatus). These resolve independently and in either order — notably,
// opening the app with no connection at all means the cross-origin YouTube
// iframe API script never loads and playerReady never becomes true, while
// loadLineup() (same-origin, fetched independently of the YouTube API) still
// runs and can still report the offline state.
function tryStartPlayback() {
  if (!playerReady) return;
  if (currentChannel !== null) return; // already playing, e.g. a later retry
  if (lineupStatus !== "success") return;

  currentChannel = pickInitialChannel();
  if (currentChannel === null) {
    showEmptyState();
    return;
  }
  switchChannel(currentChannel);
}

function videosForChannel(channelName) {
  return videosForChannelPure(allVideos, channelName);
}

function channelNowState(channelName) {
  return channelNowStatePure(allVideos, schedules, channelName);
}

// The next `count` videos in a channel's own cyclic lineup after whatever is
// playing now, with how many seconds from now each one starts. Wraps around
// for channels with only 1-2 videos, same as advanceToNext() does.
function upcomingForChannel(channelName, count) {
  const { videos, index, offset } = channelNowState(channelName);
  if (index === -1 || videos.length === 0) return [];

  const list = [];
  let startsIn = videos[index].duration - offset;
  for (let i = 1; i <= count; i++) {
    const idx = (index + i) % videos.length;
    list.push({ video: videos[idx], startsInSeconds: startsIn });
    startsIn += videos[idx].duration;
  }
  return list;
}

function formatStartsIn(seconds) {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "next";
  if (mins < 60) return `+${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem === 0 ? `+${hrs}h` : `+${hrs}h ${rem}m`;
}

function updateBadge(video, channelName) {
  const num = channelNames.indexOf(channelName) + 1;
  badgeNum.textContent = String(num).padStart(2, "0");
  badgeName.textContent = channelName;
  badgeTitle.textContent = video.title;
  toolbarChan.textContent = channelName;
}

// Enabled/disabled state is driven entirely by isChannelAvailable(currentVideos)
// — the same check #53/#54 use for the guide row/player empty state (ticket
// #52) — so all three consumers can never disagree about whether the current
// channel has anything scheduled.
function updateGoLiveButton() {
  goLiveButton.disabled = !isChannelAvailable(currentVideos);
}

function showEmptyState() {
  lineupEmpty = true;
  playerWrap.classList.add("is-unavailable");
  badgeNum.textContent = "";
  badgeName.textContent = "";
  badgeTitle.textContent = t("nothingInLineupLabel");
  toolbarChan.textContent = "";
  updateGoLiveButton();
}

function playAt(index, offsetSeconds) {
  lineupEmpty = false;
  playerWrap.classList.remove("is-unavailable");
  currentIndex = index;
  const video = currentVideos[index];
  updateBadge(video, currentChannel);
  updateGoLiveButton();
  player.loadVideoById({ videoId: video.id, startSeconds: offsetSeconds });
}

// Used when a video ends or errors out mid-playback — just move on within
// the current channel, rather than recomputing the broadcast position
// (which would skip back to wherever the schedule "really" is right now).
function advanceToNext() {
  if (currentVideos.length === 0) return;
  playAt((currentIndex + 1) % currentVideos.length, 0);
}

function pickInitialChannel() {
  if (channelNames.length === 0) return null;

  const params = new URLSearchParams(window.location.search);
  const requested = params.get("channel");
  if (requested) {
    const match = channelNames.find((name) => slug(name) === requested.toLowerCase());
    if (match) return match;
  }

  const defaultChannel = channelNames.find((name) => schedules[name] && schedules[name].default);
  if (defaultChannel) return defaultChannel;

  return channelNames[0];
}

function renderGuide() {
  guideRows.innerHTML = "";
  guideNav.reset();

  channelNames.forEach((name, i) => {
    const { videos, index } = channelNowState(name);
    const available = isChannelAvailable(videos);

    const row = document.createElement("div");
    row.className = "guide-row";
    row.dataset.channel = name;
    row.tabIndex = -1; // focus is managed entirely by guideNav, not Tab order
    // A role is required for aria-disabled to be exposed by assistive tech at
    // all — a roleless div's aria-disabled is commonly ignored by screen readers.
    row.setAttribute("role", "button");
    if (available) {
      row.addEventListener("click", () => switchChannel(name));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault(); // stop Space from also scrolling the page
          guideNav.activate();
        }
      });
    } else {
      row.setAttribute("aria-disabled", "true");
    }

    const chan = document.createElement("div");
    chan.className = "guide-chan";
    const dotColor = CHANNEL_DOT_COLORS[i % CHANNEL_DOT_COLORS.length];
    chan.innerHTML =
      `<span class="num mono">${String(i + 1).padStart(2, "0")}</span>` +
      `<span class="dot" style="background:${dotColor}"></span>` +
      `<span class="name"></span>`;
    chan.querySelector(".name").textContent = name;
    row.appendChild(chan);

    const track = document.createElement("div");
    track.className = "guide-track";

    if (index === -1) {
      const cell = document.createElement("div");
      cell.className = "guide-cell";
      cell.textContent = t("nothingScheduledLabel");
      track.appendChild(cell);
    } else {
      const nowCell = document.createElement("div");
      nowCell.className = "guide-cell now";
      const nowStart = document.createElement("span");
      nowStart.className = "start mono";
      nowStart.textContent = t("nowLabel");
      nowCell.appendChild(nowStart);
      nowCell.appendChild(document.createTextNode(videos[index].title));
      track.appendChild(nowCell);

      upcomingForChannel(name, 2).forEach(({ video, startsInSeconds }) => {
        const cell = document.createElement("div");
        cell.className = "guide-cell";
        const start = document.createElement("span");
        start.className = "start mono";
        start.textContent = formatStartsIn(startsInSeconds);
        cell.appendChild(start);
        cell.appendChild(document.createTextNode(video.title));
        track.appendChild(cell);
      });
    }

    row.appendChild(track);
    guideRows.appendChild(row);
  });
}

function openGuide() {
  guideOpen = true;
  renderGuide();
  guidePanel.hidden = false;
  guideToggle.textContent = t("guideToggleCloseLabel");
  guideToggle.setAttribute("aria-expanded", "true");
  guideNav.focusWhere((row) => row.dataset.channel === currentChannel);
}

function closeGuide() {
  if (!guideOpen) return; // avoid stealing focus on e.g. the initial switchChannel() call
  guideOpen = false;
  guideNav.reset();
  guidePanel.hidden = true;
  guideToggle.textContent = t("guideToggleOpenLabel");
  guideToggle.setAttribute("aria-expanded", "false");
  guideToggle.focus();
}

function toggleGuide() {
  if (guideOpen) {
    closeGuide();
  } else {
    openGuide();
  }
}

function switchChannel(name) {
  currentChannel = name;
  // Lets cast-sender.js (ticket #39) know which channel is showing locally,
  // without importing it here — app.js stays ignorant of casting entirely.
  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: name } }));

  const params = new URLSearchParams(window.location.search);
  params.set("channel", slug(name));
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);

  currentVideos = videosForChannel(currentChannel);
  const scheduleStartMs = new Date(schedules[currentChannel].scheduleStart).getTime();
  const { index, offset } = currentPosition(currentVideos, scheduleStartMs);

  closeGuide();

  if (!isChannelAvailable(currentVideos)) {
    showEmptyState();
    return;
  }
  playAt(index, offset);
}

// Re-tunes the current channel to its live broadcast position and resumes
// playback — identical in effect to reselecting the channel from the guide,
// since it's the same switchChannel() call (ticket #55, part of #46). A
// no-op while the current channel has nothing scheduled — the native
// `disabled` attribute already blocks a mouse/touch click, but the "l" key
// isn't gated by it, so this checks the same isChannelAvailable() source of
// truth updateGoLiveButton() drives the button's `disabled` state from.
function goLive() {
  if (!currentChannel || !isChannelAvailable(currentVideos)) return;
  switchChannel(currentChannel);
}

// Rebuilds the remote view's channel switcher (ticket #40) — one button per
// channel, highlighting whichever is currently tuned. Cheap enough to
// rebuild wholesale on every tune rather than diffing, same approach
// renderGuide() takes for the guide panel.
function renderCastingChannelList() {
  castingChannelList.innerHTML = "";
  channelNames.forEach((name) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = name;
    if (name === currentChannel) button.classList.add("active");
    button.addEventListener("click", () => remoteSwitchChannel(name));
    castingChannelList.appendChild(button);
  });
}

// Channel switching from the remote view, while a Cast session is active:
// sends the TV a "tune" message instead of driving the local player (which
// stays stopped throughout — see enterCastingView()). "neritv:channel" keeps
// cast-sender.js's own notion of the current channel in sync (the same
// event switchChannel() dispatches locally); "neritv:tune-request" is what
// actually tells it to send the tune message right now, since merely
// updating that channel wouldn't otherwise trigger a send mid-session.
function remoteSwitchChannel(name) {
  if (name === currentChannel) return; // already tuned, nothing to send
  currentChannel = name;
  window.dispatchEvent(new CustomEvent("neritv:channel", { detail: { channel: name } }));
  window.dispatchEvent(new CustomEvent("neritv:tune-request"));
  castingChannelNameEl.textContent = currentChannel;
  renderCastingChannelList();
}

// Swaps the local player/guide out for the minimal casting remote (ticket
// #40). Stops the local player outright (not just pauses it) — no point
// decoding video the phone isn't showing anymore.
function enterCastingView(deviceName) {
  casting = true;
  if (player) player.stopVideo();
  closeGuide();
  castingDeviceNameEl.textContent = deviceName || "";
  castingChannelNameEl.textContent = currentChannel || "";
  renderCastingChannelList();
  localView.hidden = true;
  castingView.hidden = false;
}

// Swaps back to the local player/guide once a Cast session ends. Resumes
// playback via the same switchChannel() path a manual channel change uses,
// so the position is computed fresh against the live schedule — never
// wherever the TV happened to be when the session ended.
function exitCastingView() {
  casting = false;
  castingView.hidden = true;
  localView.hidden = false;
  if (currentChannel !== null) {
    switchChannel(currentChannel);
  } else {
    tryStartPlayback();
  }
}

function onPlayerReady() {
  player.mute();
  playerReady = true;
  tryStartPlayback();
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    advanceToNext();
  }
}

function onPlayerError() {
  advanceToNext();
}

// A real toggle (not the one-shot "unmute and hide forever" it used to be) —
// needed so the "M" shortcut means something coming back from a muted state,
// not just a second way to do the one thing the button already did.
function toggleMute() {
  if (!player) return;
  if (player.isMuted()) {
    player.unMute();
    unmuteButton.textContent = t("tapToMuteLabel");
  } else {
    player.mute();
    unmuteButton.textContent = t("tapToUnmuteLabel");
  }
}

// Re-renders every piece of chrome text this module owns that isn't static
// markup, in the newly-active language — called once at startup (to sync
// #guide-toggle/#unmute past their static HTML defaults, which only match
// English) and again on every language toggle (ticket #31, spec #22). Each
// piece only re-renders if it's actually showing right now, using the same
// state this module already tracks, so toggling the language never changes
// *what's* on screen, just which language it reads in.
function refreshChromeLanguage() {
  guideToggle.textContent = guideOpen ? t("guideToggleCloseLabel") : t("guideToggleOpenLabel");
  unmuteButton.textContent =
    player && !player.isMuted() ? t("tapToMuteLabel") : t("tapToUnmuteLabel");
  goLiveButton.textContent = t("goLiveLabel");
  if (guideOpen) renderGuide();
  if (lineupEmpty) showEmptyState();
  renderScheduleMessage();
}

onLanguageChange(refreshChromeLanguage);
refreshChromeLanguage();

unmuteButton.addEventListener("click", toggleMute);
guideToggle.addEventListener("click", toggleGuide);
goLiveButton.addEventListener("click", goLive);

// Dispatched by cast-sender.js (ticket #39/#40) on every Cast session
// state change — this is the one place app.js learns casting happened at
// all, keeping it ignorant of the Cast Framework itself.
window.addEventListener("neritv:cast-session", (event) => {
  if (event.detail.active) {
    enterCastingView(event.detail.deviceName);
  } else {
    exitCastingView();
  }
});

stopCastingButton.addEventListener("click", () => {
  window.dispatchEvent(new CustomEvent("neritv:stop-casting"));
});

// Global keyboard shortcuts, independent of what currently has focus.
// Arrow keys move within the guide once it's open; while it's closed they
// (like "G") open it instead, focused on whatever channel is live now — the
// common "press a direction to see what's on" remote-control convention.
const VERTICAL_ARROWS = { ArrowUp: -1, ArrowDown: 1 };
const ANY_ARROW = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

document.addEventListener("keydown", (event) => {
  // These all act on #local-view (the player/guide), which is hidden and
  // superseded by #casting-view while a Cast session is active (ticket
  // #40) — the phone isn't a second player at that point, so none of its
  // local shortcuts should fire.
  if (casting) return;

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === "m") {
    toggleMute();
    return;
  }

  if (key === "Escape") {
    closeGuide();
    return;
  }

  if (key === "g") {
    toggleGuide();
    return;
  }

  if (key === "l") {
    goLive();
    return;
  }

  if (ANY_ARROW.has(key) && !guideOpen) {
    event.preventDefault(); // don't also scroll the page
    openGuide();
    return;
  }

  // ArrowLeft/ArrowRight do nothing once the guide is open — a channel row
  // is one selectable unit (see GLOSSARY.md: Channel row), there's no
  // horizontal target within it to move to.
  if (guideOpen && key in VERTICAL_ARROWS) {
    event.preventDefault();
    guideNav.move(VERTICAL_ARROWS[key]);
  }
});

// Swipe gestures — a second input source feeding the same nav.js calls
// keyboard uses (see ADR-0001). Scoped to the guide panel only: gestures
// never touch the player itself (a cross-origin YouTube iframe, to avoid
// fighting its own touch handling), and opening/closing the guide stays
// button-driven — only navigation within an already-open guide is gesture-
// driven. Swipe up/down moves focus a row at a time (discrete paging, not
// free scroll — not a concern yet at 2 channels, revisit if that grows);
// swipe right activates the focused row. A plain tap still works via each
// row's own click handler, unchanged.
const SWIPE_THRESHOLD_PX = 40;
let touchStart = { x: 0, y: 0 };

// {dx, dy, absDx, absDy} from touchStart to the given touch point — the one
// place that shape is computed, used by both touchmove and touchend below.
function touchDelta(touch) {
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  return { dx, dy, absDx: Math.abs(dx), absDy: Math.abs(dy) };
}

guidePanel.addEventListener(
  "touchstart",
  (event) => {
    if (!guideOpen) return; // belt-and-suspenders alongside guidePanel[hidden]
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  },
  { passive: true }
);

guidePanel.addEventListener(
  "touchmove",
  (event) => {
    if (!guideOpen) return;
    const { absDx, absDy } = touchDelta(event.touches[0]);
    // Only suppress scrolling for a vertical-dominant drag — a horizontal
    // one is left alone so .guide-track's own overflow-x scroll still works.
    if (absDy > absDx) {
      event.preventDefault();
    }
  },
  { passive: false }
);

guidePanel.addEventListener("touchend", (event) => {
  if (!guideOpen) return;
  const { dx, dy, absDx, absDy } = touchDelta(event.changedTouches[0]);

  if (absDy > absDx && absDy > SWIPE_THRESHOLD_PX) {
    guideNav.move(dy < 0 ? 1 : -1); // swipe up -> next row, swipe down -> previous row
  } else if (dx > SWIPE_THRESHOLD_PX && absDx > absDy) {
    guideNav.activate();
  }
});

// Creating the player and loading the lineup are independent of each other
// (see tryStartPlayback() above) — this callback only fires once the
// cross-origin YouTube iframe API script has itself loaded, which (unlike
// the same-origin lineup fetch) requires the real network and never fires
// at all when opening the app fully offline.
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 1,
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
// manual refresh required (ticket #9). navigator.onLine false->true is what
// fires "online"; selectLineupMessage() re-evaluates from the fresh result.
window.addEventListener("online", () => {
  loadLineup().then(applyLineupState);
});

loadLineup().then(applyLineupState);
