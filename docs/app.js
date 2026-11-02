let allVideos = [];
let schedules = {};
let channelNames = [];
let currentChannel = null;
let currentVideos = [];
let player = null;
let currentIndex = -1;
let guideOpen = false;

const CHANNEL_DOT_COLORS = ["var(--accent)", "var(--kebire)", "#9a7fd1", "#d97757"];

// Drives focus through the guide's channel rows — see nav.js. Keyboard is
// the only input source today; a later TV-stick remote feeds the same
// move()/activate() calls from its own input events.
const guideNav = createListNav({
  getItems: () => Array.from(guideRows.querySelectorAll(".guide-row")),
  onActivate: (row) => switchChannel(row.dataset.channel),
});

const badgeNum = document.getElementById("badge-num");
const badgeName = document.getElementById("badge-name");
const badgeTitle = document.getElementById("badge-title");
const unmuteButton = document.getElementById("unmute");
const guidePanel = document.getElementById("guide-panel");
const guideRows = document.getElementById("guide-rows");
const guideToggle = document.getElementById("guide-toggle");
const toolbarChan = document.getElementById("toolbar-chan");

function slug(name) {
  return name.toLowerCase();
}

async function loadLineup() {
  const res = await fetch("data/videos.json", { cache: "no-store" });
  const data = await res.json();
  allVideos = data.videos || [];
  schedules = data.schedules || {};
  channelNames = Object.keys(schedules);
}

function videosForChannel(channelName) {
  return allVideos.filter((v) => Array.isArray(v.channels) && v.channels.includes(channelName));
}

function totalDuration(videoList) {
  return videoList.reduce((sum, v) => sum + v.duration, 0);
}

// Where in a channel's own lineup "now" falls, given that channel's fixed broadcast schedule.
function currentPosition(videoList, scheduleStartMs) {
  const total = totalDuration(videoList);
  if (total === 0) return { index: -1, offset: 0 };

  const elapsedMs = Date.now() - scheduleStartMs;
  let elapsed = (((elapsedMs / 1000) % total) + total) % total;

  for (let i = 0; i < videoList.length; i++) {
    if (elapsed < videoList[i].duration) {
      return { index: i, offset: Math.floor(elapsed) };
    }
    elapsed -= videoList[i].duration;
  }
  return { index: 0, offset: 0 };
}

function channelNowState(channelName) {
  const videos = videosForChannel(channelName);
  const scheduleStartMs = new Date(schedules[channelName].scheduleStart).getTime();
  const { index, offset } = currentPosition(videos, scheduleStartMs);
  return { videos, index, offset };
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

function showEmptyState() {
  badgeNum.textContent = "";
  badgeName.textContent = "";
  badgeTitle.textContent = "Nothing in the lineup yet";
  toolbarChan.textContent = "";
}

function playAt(index, offsetSeconds) {
  currentIndex = index;
  const video = currentVideos[index];
  updateBadge(video, currentChannel);
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

    const row = document.createElement("div");
    row.className = "guide-row";
    row.dataset.channel = name;
    row.tabIndex = -1; // focus is managed entirely by guideNav, not Tab order
    row.addEventListener("click", () => switchChannel(name));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault(); // stop Space from also scrolling the page
        guideNav.activate();
      }
    });

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
      cell.textContent = "Nothing scheduled";
      track.appendChild(cell);
    } else {
      const nowCell = document.createElement("div");
      nowCell.className = "guide-cell now";
      const nowStart = document.createElement("span");
      nowStart.className = "start mono";
      nowStart.textContent = "NOW";
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
  guideToggle.textContent = "Close ✕";
  guideToggle.setAttribute("aria-expanded", "true");
  guideNav.focusWhere((row) => row.dataset.channel === currentChannel);
}

function closeGuide() {
  if (!guideOpen) return; // avoid stealing focus on e.g. the initial switchChannel() call
  guideOpen = false;
  guideNav.reset();
  guidePanel.hidden = true;
  guideToggle.textContent = "Guide ▾";
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

  const params = new URLSearchParams(window.location.search);
  params.set("channel", slug(name));
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);

  currentVideos = videosForChannel(currentChannel);
  const scheduleStartMs = new Date(schedules[currentChannel].scheduleStart).getTime();
  const { index, offset } = currentPosition(currentVideos, scheduleStartMs);

  closeGuide();

  if (index === -1) {
    showEmptyState();
    return;
  }
  playAt(index, offset);
}

function onPlayerReady() {
  player.mute();
  currentChannel = pickInitialChannel();
  if (currentChannel === null) {
    showEmptyState();
    return;
  }
  switchChannel(currentChannel);
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
    unmuteButton.textContent = "🔊 Tap to mute";
  } else {
    player.mute();
    unmuteButton.textContent = "🔇 Tap to unmute";
  }
}

unmuteButton.addEventListener("click", toggleMute);
guideToggle.addEventListener("click", toggleGuide);

// Global keyboard shortcuts, independent of what currently has focus.
// Arrow keys move within the guide once it's open; while it's closed they
// (like "G") open it instead, focused on whatever channel is live now — the
// common "press a direction to see what's on" remote-control convention.
const VERTICAL_ARROWS = { ArrowUp: -1, ArrowDown: 1 };
const ANY_ARROW = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);

document.addEventListener("keydown", (event) => {
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

window.onYouTubeIframeAPIReady = async function () {
  await loadLineup();
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
