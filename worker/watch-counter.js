// Cloudflare Worker that receives an anonymous per-channel "watch" beacon
// from the app and increments a Workers KV counter keyed by (channel
// identifier, ISO week) — ticket #114, part of #113. The only legitimate
// caller is the app itself, never a human, so every outcome (accepted or
// rejected) returns the same empty response: a prober hitting this endpoint
// directly can't tell a bad Origin from an unknown channel from success.
import { KNOWN_CHANNELS } from "./channels.generated.js";

export function isAllowedOrigin(origin, allowedOrigin) {
  return origin === allowedOrigin;
}

export function isKnownChannel(channelId, knownChannels) {
  return knownChannels.includes(channelId);
}

// The Thursday of the ISO week containing `date` — ISO 8601 defines a year's
// week 1 as the week containing that year's first Thursday, so pinning both
// the input date and each candidate year's reference point to "its week's
// Thursday" is what makes the week number comparable between them.
function nearestThursday(date) {
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (thursday.getUTCDay() + 6) % 7; // Monday = 0 .. Sunday = 6
  thursday.setUTCDate(thursday.getUTCDate() - dayNum + 3);
  return thursday;
}

// ISO 8601 week-numbering: the week containing the year's first Thursday is
// week 1, so a key derived from this (rather than from the calendar week or
// month) never splits or merges across a year boundary in a surprising way.
export function isoWeekKey(date) {
  const thisThursday = nearestThursday(date);
  const firstThursday = nearestThursday(new Date(Date.UTC(thisThursday.getUTCFullYear(), 0, 4)));

  const weekNumber = 1 + Math.round((thisThursday - firstThursday) / (7 * 24 * 60 * 60 * 1000));
  return `${thisThursday.getUTCFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

export function watchCountKey(channelId, date) {
  return `${channelId}:${isoWeekKey(date)}`;
}

export function shouldAcceptWatch({ origin, channelId, allowedOrigin, knownChannels }) {
  return isAllowedOrigin(origin, allowedOrigin) && isKnownChannel(channelId, knownChannels);
}

export async function recordWatch(kv, key) {
  const current = await kv.get(key);
  const count = current === null ? 0 : parseInt(current, 10);
  await kv.put(key, String(count + 1));
}

// A JSON POST isn't a CORS "simple request", so the browser sends an OPTIONS
// preflight first; without a matching Access-Control-Allow-Origin here, the
// browser blocks the real POST before it ever reaches the checks below.
function corsHeaders(allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function emptyResponse(allowedOrigin) {
  return new Response(null, { status: 204, headers: corsHeaders(allowedOrigin) });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS" || request.method !== "POST") {
      return emptyResponse(env.ALLOWED_ORIGIN);
    }

    let channel;
    try {
      ({ channel } = await request.json());
    } catch {
      return emptyResponse(env.ALLOWED_ORIGIN);
    }

    const accepted = shouldAcceptWatch({
      origin: request.headers.get("Origin"),
      channelId: channel,
      allowedOrigin: env.ALLOWED_ORIGIN,
      knownChannels: KNOWN_CHANNELS,
    });

    if (accepted) {
      await recordWatch(env.WATCH_COUNTS, watchCountKey(channel, new Date()));
    }

    return emptyResponse(env.ALLOWED_ORIGIN);
  },
};
