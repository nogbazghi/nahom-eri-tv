// Pure decision logic answering "does this channel have anything scheduled
// right now?" — the single source of truth every channel-availability
// consumer (guide row, nav filter, Go-to-Live button) will share, so they
// can never disagree. No DOM access, no module-level state, so this is both
// <script type="module">-loadable by the browser and import-able directly
// by node --test (channel-availability.test.js) — see ticket #52, part of
// #46.
export function isChannelAvailable(videoList) {
  return videoList.length > 0;
}
