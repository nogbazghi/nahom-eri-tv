let videos = [];
let scheduleStart = 0;
let player = null;
let currentIndex = -1;

const creditTitle = document.getElementById("credit-title");
const creditChannel = document.getElementById("credit-channel");
const unmuteButton = document.getElementById("unmute");

async function loadLineup() {
  const res = await fetch("data/videos.json", { cache: "no-store" });
  const data = await res.json();
  videos = data.videos || [];
  scheduleStart = data.scheduleStart ? new Date(data.scheduleStart).getTime() : Date.now();
}

function totalDuration() {
  return videos.reduce((sum, v) => sum + v.duration, 0);
}

// Where in the lineup "now" falls, given the fixed broadcast schedule.
function currentPosition() {
  const total = totalDuration();
  if (total === 0) return { index: -1, offset: 0 };

  const elapsedMs = Date.now() - scheduleStart;
  let elapsed = (((elapsedMs / 1000) % total) + total) % total;

  for (let i = 0; i < videos.length; i++) {
    if (elapsed < videos[i].duration) {
      return { index: i, offset: Math.floor(elapsed) };
    }
    elapsed -= videos[i].duration;
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
  const video = videos[index];
  updateCredit(video);
  player.loadVideoById({ videoId: video.id, startSeconds: offsetSeconds });
}

// Used when a video ends or errors out mid-playback — just move on,
// rather than recomputing the broadcast position (which would skip
// back to wherever the schedule "really" is right now).
function advanceToNext() {
  if (videos.length === 0) return;
  playAt((currentIndex + 1) % videos.length, 0);
}

function onPlayerReady() {
  player.mute();
  const { index, offset } = currentPosition();
  if (index === -1) {
    showEmptyState();
    return;
  }
  playAt(index, offset);
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
