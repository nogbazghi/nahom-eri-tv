import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDuration,
  buildThumbnailUrl,
  buildYoutubeUrl,
  groupCandidatesByChannel,
  candidateKey,
  approveCandidate,
  rejectCandidate,
  markDuplicate,
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

test("groupCandidatesByChannel: additions group under their candidate's display channel", () => {
  const additions = [
    { id: "abc123", title: "A new song", channels: ["Music - Modern"], source: "music_modern" },
  ];

  assert.deepEqual(groupCandidatesByChannel(additions), [
    {
      channel: "Music - Modern",
      candidates: [
        { id: "abc123", title: "A new song", channels: ["Music - Modern"], source: "music_modern" },
      ],
    },
  ]);
});

test("groupCandidatesByChannel: additions from two different sources feeding the same display channel merge into one group", () => {
  const additions = [
    {
      id: "id1",
      title: "Independence clip",
      channels: ["Independence Day"],
      source: "independence_day_diaspora",
    },
    {
      id: "id2",
      title: "Martyrs clip",
      channels: ["Independence Day"],
      source: "martyrs_day_diaspora",
    },
  ];

  assert.deepEqual(groupCandidatesByChannel(additions), [
    {
      channel: "Independence Day",
      candidates: [
        {
          id: "id1",
          title: "Independence clip",
          channels: ["Independence Day"],
          source: "independence_day_diaspora",
        },
        {
          id: "id2",
          title: "Martyrs clip",
          channels: ["Independence Day"],
          source: "martyrs_day_diaspora",
        },
      ],
    },
  ]);
});

test("groupCandidatesByChannel: groups are sorted alphabetically by channel name", () => {
  const additions = [
    { id: "w1", title: "A wedding", channels: ["Weddings"], source: "weddings" },
    { id: "m1", title: "A song", channels: ["Music - Modern"], source: "music_modern" },
  ];

  assert.deepEqual(
    groupCandidatesByChannel(additions).map((group) => group.channel),
    ["Music - Modern", "Weddings"],
  );
});

test("groupCandidatesByChannel: no additions contributes no groups", () => {
  assert.deepEqual(groupCandidatesByChannel([]), []);
});

test("candidateKey: combines id and source", () => {
  assert.equal(candidateKey({ id: "abc123", source: "movies_hdmona" }), "abc123::movies_hdmona");
});

test("candidateKey: two candidates sharing an id but with different sources produce different keys", () => {
  const a = { id: "abc123", source: "movies_hdmona" };
  const b = { id: "abc123", source: "movies_search" };
  assert.notEqual(candidateKey(a), candidateKey(b));
});

test("approveCandidate: records an approved decision for the candidate key, leaving other decisions untouched", () => {
  const decisions = { other1: { status: "approved" } };
  assert.deepEqual(approveCandidate(decisions, "abc123::movies_hdmona"), {
    other1: { status: "approved" },
    "abc123::movies_hdmona": { status: "approved" },
  });
});

test("rejectCandidate: records a rejected decision with the trimmed reason", () => {
  assert.deepEqual(
    rejectCandidate({}, "abc123::movies_hdmona", "  off-topic, Burmese-language news  "),
    {
      "abc123::movies_hdmona": { status: "rejected", reason: "off-topic, Burmese-language news" },
    },
  );
});

test("rejectCandidate: throws when the reason is empty or all whitespace", () => {
  assert.throws(() => rejectCandidate({}, "abc123::movies_hdmona", ""));
  assert.throws(() => rejectCandidate({}, "abc123::movies_hdmona", "   "));
});

test("markDuplicate: records a duplicate decision for the candidate key, with no reason, leaving other decisions untouched", () => {
  const decisions = { other1: { status: "approved" } };
  assert.deepEqual(markDuplicate(decisions, "abc123::movies_search"), {
    other1: { status: "approved" },
    "abc123::movies_search": { status: "duplicate" },
  });
});

test("undoDecision: removes the candidate's decision, reverting it to pending, leaving other decisions untouched", () => {
  const decisions = {
    "abc123::movies_hdmona": { status: "approved" },
    other1: { status: "rejected", reason: "off-topic" },
  };
  assert.deepEqual(undoDecision(decisions, "abc123::movies_hdmona"), {
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
    { channel: "Music - Modern", candidates: [{ id: "m1", source: "s" }, { id: "m2", source: "s" }] },
    { channel: "Weddings", candidates: [{ id: "w1", source: "s" }] },
  ];
  const decisions = { "m1::s": { status: "approved" }, "w1::s": { status: "approved" } };
  assert.equal(isReviewComplete(groups, decisions), false);
});

test("isReviewComplete: true once every candidate across every group has a decision", () => {
  const groups = [
    { channel: "Music - Modern", candidates: [{ id: "m1", source: "s" }, { id: "m2", source: "s" }] },
    { channel: "Weddings", candidates: [{ id: "w1", source: "s" }] },
  ];
  const decisions = {
    "m1::s": { status: "approved" },
    "m2::s": { status: "rejected", reason: "off-topic" },
    "w1::s": { status: "approved" },
  };
  assert.equal(isReviewComplete(groups, decisions), true);
});

test("isReviewComplete: two candidates sharing an id but different source are tracked as independent decisions", () => {
  const groups = [
    {
      channel: "Movies",
      candidates: [
        { id: "seb-mukan", source: "movies_hdmona" },
        { id: "seb-mukan", source: "movies_search" },
      ],
    },
  ];
  const decisions = { "seb-mukan::movies_hdmona": { status: "approved" } };
  assert.equal(isReviewComplete(groups, decisions), false);
});

test("computeWriteBackPayload: sorts approved candidates into approvedIds and rejected candidates into rejected with their reason, ignoring undecided ones", () => {
  const groups = [
    {
      channel: "Music - Modern",
      candidates: [{ id: "m1", source: "s" }, { id: "m2", source: "s" }, { id: "m3", source: "s" }],
    },
  ];
  const decisions = {
    "m1::s": { status: "approved" },
    "m2::s": { status: "rejected", reason: "off-topic" },
  };
  assert.deepEqual(computeWriteBackPayload(groups, decisions), {
    approvedIds: ["m1"],
    rejected: [{ id: "m2", reason: "off-topic" }],
    duplicates: [],
  });
});

test("computeWriteBackPayload: sorts duplicate-marked candidates into duplicates as {id, source}, with no reason field", () => {
  const groups = [
    {
      channel: "Movies",
      candidates: [
        { id: "seb-mukan", source: "movies_hdmona" },
        { id: "seb-mukan", source: "movies_search" },
      ],
    },
  ];
  const decisions = {
    "seb-mukan::movies_hdmona": { status: "approved" },
    "seb-mukan::movies_search": { status: "duplicate" },
  };
  assert.deepEqual(computeWriteBackPayload(groups, decisions), {
    approvedIds: ["seb-mukan"],
    rejected: [],
    duplicates: [{ id: "seb-mukan", source: "movies_search" }],
  });
});
