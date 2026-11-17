import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDuration,
  buildThumbnailUrl,
  buildYoutubeUrl,
  groupCandidatesByChannel,
} from "./curation-review.js";

test("formatDuration: under a minute renders M:SS with no leading zero on minutes", () => {
  assert.equal(formatDuration(45), "0:45");
});

test("formatDuration: minutes and seconds pad seconds but not minutes", () => {
  assert.equal(formatDuration(125), "2:05");
});

test("formatDuration: an hour or more renders H:MM:SS with padded minutes and seconds", () => {
  assert.equal(formatDuration(3661), "1:01:01");
});

test("buildThumbnailUrl: constructs YouTube's standard hqdefault thumbnail URL from a video id", () => {
  assert.equal(
    buildThumbnailUrl("ZQ9GP-absUk"),
    "https://i.ytimg.com/vi/ZQ9GP-absUk/hqdefault.jpg",
  );
});

test("buildYoutubeUrl: constructs a direct watch URL from a video id", () => {
  assert.equal(
    buildYoutubeUrl("ZQ9GP-absUk"),
    "https://www.youtube.com/watch?v=ZQ9GP-absUk",
  );
});

test("groupCandidatesByChannel: one summary's additions group under that candidate's display channel", () => {
  const summaries = [
    {
      channel: "music_modern",
      additions: [{ id: "abc123", title: "A new song", channels: ["Music - Modern"] }],
      removals: [],
    },
  ];

  assert.deepEqual(groupCandidatesByChannel(summaries), [
    {
      channel: "Music - Modern",
      candidates: [{ id: "abc123", title: "A new song", channels: ["Music - Modern"] }],
    },
  ]);
});

test("groupCandidatesByChannel: two summaries feeding the same display channel merge into one group", () => {
  const summaries = [
    {
      channel: "independence_day_diaspora",
      additions: [{ id: "id1", title: "Independence clip", channels: ["Independence Day"] }],
      removals: [],
    },
    {
      channel: "martyrs_day_diaspora",
      additions: [{ id: "id2", title: "Martyrs clip", channels: ["Independence Day"] }],
      removals: [],
    },
  ];

  assert.deepEqual(groupCandidatesByChannel(summaries), [
    {
      channel: "Independence Day",
      candidates: [
        { id: "id1", title: "Independence clip", channels: ["Independence Day"] },
        { id: "id2", title: "Martyrs clip", channels: ["Independence Day"] },
      ],
    },
  ]);
});

test("groupCandidatesByChannel: groups are sorted alphabetically by channel name", () => {
  const summaries = [
    {
      channel: "weddings",
      additions: [{ id: "w1", title: "A wedding", channels: ["Weddings"] }],
      removals: [],
    },
    {
      channel: "music_modern",
      additions: [{ id: "m1", title: "A song", channels: ["Music - Modern"] }],
      removals: [],
    },
  ];

  assert.deepEqual(
    groupCandidatesByChannel(summaries).map((group) => group.channel),
    ["Music - Modern", "Weddings"],
  );
});

test("groupCandidatesByChannel: a summary with no additions contributes no group", () => {
  const summaries = [{ channel: "weddings", additions: [], removals: [] }];
  assert.deepEqual(groupCandidatesByChannel(summaries), []);
});
