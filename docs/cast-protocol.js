// Shared Cast custom-message contract between docs/cast-sender.js and
// docs/cast-receiver.js (ticket #39, part of spec #35). The two scripts load
// in entirely separate contexts (phone browser vs. Cast receiver sandbox),
// so this is the one place the namespace string and message shape are
// written down, to keep them from drifting apart independently.
export const TUNE_NAMESPACE = "urn:x-cast:tv.nahomeri.tune";
export const TUNE_MESSAGE_TYPE = "tune";

export function tuneMessage(channel) {
  return { type: TUNE_MESSAGE_TYPE, channel };
}
