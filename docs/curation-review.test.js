import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDuration,
  buildThumbnailUrl,
  buildYoutubeUrl,
  groupCandidatesByChannel,
  approveCandidate,
  rejectCandidate,
  undoDecision,
  countReviewed,
  countTotalCandidates,
  isReviewComplete,
  computeWriteBackPayload,
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

test("approveCandidate: records an approved decision for the candidate id, leaving other decisions untouched", () => {
  const decisions = { other1: { status: "approved" } };
  assert.deepEqual(approveCandidate(decisions, "abc123"), {
    other1: { status: "approved" },
    abc123: { status: "approved" },
  });
});

test("rejectCandidate: records a rejected decision with the trimmed reason", () => {
  assert.deepEqual(rejectCandidate({}, "abc123", "  off-topic, Burmese-language news  "), {
    abc123: { status: "rejected", reason: "off-topic, Burmese-language news" },
  });
});

test("rejectCandidate: throws when the reason is empty or all whitespace", () => {
  assert.throws(() => rejectCandidate({}, "abc123", ""));
  assert.throws(() => rejectCandidate({}, "abc123", "   "));
});

test("undoDecision: removes the candidate's decision, reverting it to pending, leaving other decisions untouched", () => {
  const decisions = {
    abc123: { status: "approved" },
    other1: { status: "rejected", reason: "off-topic" },
  };
  assert.deepEqual(undoDecision(decisions, "abc123"), {
    other1: { status: "rejected", reason: "off-topic" },
  });
});

test("countTotalCandidates: sums candidates across every group", () => {
  const groups = [
    { channel: "Music - Modern", candidates: [{ id: "m1" }, { id: "m2" }] },
    { channel: "Weddings", candidates: [{ id: "w1" }] },
  ];
  assert.equal(countTotalCandidates(groups), 3);
});

test("countReviewed: counts the number of decided candidates", () => {
  const decisions = {
    abc123: { status: "approved" },
    def456: { status: "rejected", reason: "off-topic" },
  };
  assert.equal(countReviewed(decisions), 2);
});

test("isReviewComplete: false while any candidate across any group is undecided", () => {
  const groups = [
    { channel: "Music - Modern", candidates: [{ id: "m1" }, { id: "m2" }] },
    { channel: "Weddings", candidates: [{ id: "w1" }] },
  ];
  const decisions = { m1: { status: "approved" }, w1: { status: "approved" } };
  assert.equal(isReviewComplete(groups, decisions), false);
});

test("isReviewComplete: true once every candidate across every group has a decision", () => {
  const groups = [
    { channel: "Music - Modern", candidates: [{ id: "m1" }, { id: "m2" }] },
    { channel: "Weddings", candidates: [{ id: "w1" }] },
  ];
  const decisions = {
    m1: { status: "approved" },
    m2: { status: "rejected", reason: "off-topic" },
    w1: { status: "approved" },
  };
  assert.equal(isReviewComplete(groups, decisions), true);
});

test("computeWriteBackPayload: sorts approved candidates into approvedIds and rejected candidates into rejected with their reason, ignoring undecided ones", () => {
  const groups = [
    {
      channel: "Music - Modern",
      candidates: [{ id: "m1" }, { id: "m2" }, { id: "m3" }],
    },
  ];
  const decisions = {
    m1: { status: "approved" },
    m2: { status: "rejected", reason: "off-topic" },
  };
  assert.deepEqual(computeWriteBackPayload(groups, decisions), {
    approvedIds: ["m1"],
    rejected: [{ id: "m2", reason: "off-topic" }],
  });
});
