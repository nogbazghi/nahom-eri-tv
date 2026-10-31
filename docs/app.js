let allVideos = [];
let schedules = {};
let channelNames = [];
let currentChannel = null;
let currentVideos = [];
let player = null;
let currentIndex = -1;

const creditTitle = document.getElementById("credit-title");
const creditChannel = document.getElementById("credit-channel");
const unmuteButton = document.getElementById("unmute");
const switcherEl = document.getElementById("channel-switcher");

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

function updateCredit(video) {
  creditTitle.textContent = video.title;
  creditChannel.textContent = `by ${video.channel}`;
}

function showEmptyState() {
  creditTitle.textContent = "Nothing in the lineup yet";
  creditChannel.textContent = "Check back soon.";
}

function playAt(index, offsetSeconds) {
  currentIndex = index;
  const video = currentVideos[index];
  updateCredit(video);
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

function renderSwitcher() {
  switcherEl.innerHTML = "";
  if (channelNames.length < 2) return; // nothing to switch between

  channelNames.forEach((name) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = name;
    btn.className = "channel-tab" + (name === currentChannel ? " active" : "");
    btn.addEventListener("click", () => switchChannel(name));
    switcherEl.appendChild(btn);
  });
}

function switchChannel(name) {
  if (name === currentChannel && currentVideos.length > 0) return;
  currentChannel = name;

  const params = new URLSearchParams(window.location.search);
  params.set("channel", slug(name));
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", newUrl);

  renderSwitcher();

  currentVideos = videosForChannel(currentChannel);
  const scheduleStartMs = new Date(schedules[currentChannel].scheduleStart).getTime();
  const { index, offset } = currentPosition(currentVideos, scheduleStartMs);
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

unmuteButton.addEventListener("click", () => {
  if (player) player.unMute();
  unmuteButton.hidden = true;
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
