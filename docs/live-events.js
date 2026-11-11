// Pure decision logic answering "which liveEvents entries are visible in the
// guide right now?" — a sibling to channel-availability.js's "does this
// channel have anything scheduled" check, not an extension of schedule.js's
// cyclic-lineup math: a Live event has no lineup to compute a position
// within, just a single video and a visibility window around its scheduled
// start. No DOM access, no module-level state, so this is both
// <script type="module">-loadable by the browser (app.js) and import-able
// directly by node --test (live-events.test.js) — see ticket #86, part of
// spec #82.
//
// Each docs/data/videos.json `liveEvents` entry (written by
// curation/merge_live_events.py, ticket #85) has the shape:
//   { id, displayName, title, channel, scheduledStart, leadTimeHours?, expireAfterHours? }
// `id` is the source video's YouTube id; `scheduledStart` is an ISO 8601
// string; `leadTimeHours`/`expireAfterHours` default to
// DEFAULT_LEAD_TIME_HOURS/DEFAULT_EXPIRE_AFTER_HOURS when omitted. `title`
// and `channel` come from the same shared YouTube-metadata-fetch helper
// that gives every `videos` array entry its own `title` — `channel` isn't
// used here, but `title` is: the guide needs it to show a Live event row's
// actual video title (ticket #86), the same content a Channel row's cell
// shows, rather than repeating `displayName` (the chan-column equivalent)
// in both places.

export const DEFAULT_LEAD_TIME_HOURS = 2;
export const DEFAULT_EXPIRE_AFTER_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

// Visible from lead-time-before-start through expiry-after-start,
// inclusive of both boundaries.
export function isLiveEventVisible(event, nowMs) {
  const startMs = new Date(event.scheduledStart).getTime();
  const leadMs = (event.leadTimeHours ?? DEFAULT_LEAD_TIME_HOURS) * HOUR_MS;
  const expireMs = (event.expireAfterHours ?? DEFAULT_EXPIRE_AFTER_HOURS) * HOUR_MS;
  return nowMs >= startMs - leadMs && nowMs <= startMs + expireMs;
}

export function visibleLiveEvents(liveEvents, nowMs) {
  return liveEvents.filter((event) => isLiveEventVisible(event, nowMs));
}
