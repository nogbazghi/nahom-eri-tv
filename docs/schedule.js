// Pure broadcast-position math: given the full video list and a channel's
// fixed schedule, what's playing right now on that channel? No DOM, no
// network, so this is both <script type="module">-loadable by the browser
// (app.js) and import-able directly by node --test (schedule.test.js) — see
// ticket #36.

export function videosForChannel(allVideos, channelName) {
  return allVideos.filter((v) => Array.isArray(v.channels) && v.channels.includes(channelName));
}

export function totalDuration(videoList) {
  return videoList.reduce((sum, v) => sum + v.duration, 0);
}

// Where in a channel's own lineup "now" falls, given that channel's fixed broadcast schedule.
export function currentPosition(videoList, scheduleStartMs) {
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

export function channelNowState(allVideos, schedules, channelName) {
  const videos = videosForChannel(allVideos, channelName);
  const scheduleStartMs = new Date(schedules[channelName].scheduleStart).getTime();
  const { index, offset } = currentPosition(videos, scheduleStartMs);
  return { videos, index, offset };
}
