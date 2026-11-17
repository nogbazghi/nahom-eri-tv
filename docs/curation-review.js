// Pure curation-review decision/presentation logic (ticket #106, part of
// #105). No DOM or network access — mirrors favorites.js — so this is both
// <script type="module">-loadable by curation-review-ui.js and import-able
// directly by node --test (curation-review.test.js).

export function formatDuration(totalSeconds) {
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  if (hours === 0) {
    return `${totalMinutes}:${seconds}`;
  }
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function buildThumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function buildYoutubeUrl(videoId) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

// Groups every candidate addition across every .pending/<channel>.json
// summary by its front-end display channel (addition.channels[0]) rather
// than the summary's own internal pipeline rule key — two rules
// (independence_day_diaspora, martyrs_day_diaspora) can both feed the same
// display channel, and candidates from both must land in one group.
// Removals are never candidates for review (ADR: removals bypass PR review
// — curation/ARCHITECTURE.md) and are ignored here.
export function groupCandidatesByChannel(pendingSummaries) {
  const byChannel = new Map();
  for (const summary of pendingSummaries) {
    for (const candidate of summary.additions) {
      const channel = candidate.channels[0];
      if (!byChannel.has(channel)) {
        byChannel.set(channel, []);
      }
      byChannel.get(channel).push(candidate);
    }
  }
  return [...byChannel.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([channel, candidates]) => ({ channel, candidates }));
}
