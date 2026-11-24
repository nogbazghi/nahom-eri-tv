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

// Groups every candidate addition by its front-end display channel
// (addition.channels[0]) rather than its internal pipeline source rule —
// two rules (independence_day_diaspora, martyrs_day_diaspora) can both feed
// the same display channel, and candidates from both must land in one
// group. Removals are never candidates for review (ADR: removals bypass PR
// review — curation/ARCHITECTURE.md) and never appear in `additions`.
export function groupCandidatesByChannel(additions) {
  const byChannel = new Map();
  for (const candidate of additions) {
    const channel = candidate.channels[0];
    if (!byChannel.has(channel)) {
      byChannel.set(channel, []);
    }
    byChannel.get(channel).push(candidate);
  }
  return [...byChannel.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([channel, candidates]) => ({ channel, candidates }));
}

// Identifies a candidate within a run by (id, source) rather than by its
// bare id — two channel rules can independently discover the same
// underlying video id (ADR-0019's "Seb Mukan" example: Movies' both
// movies_hdmona and movies_search), and each such discovery is reviewed as
// its own independent candidate, not collapsed into one.
export function candidateKey(candidate) {
  return `${candidate.id}::${candidate.source}`;
}

// Decision bookkeeping (ticket #107, part of #105): `decisions` is a plain
// object keyed by candidateKey(candidate), each value `{status: "approved"}`,
// `{status: "rejected", reason}`, or `{status: "duplicate"}`. Every function
// here returns a new object rather than mutating, the same immutable-update
// style as favorites.js's toggleFavorite.
export function approveCandidate(decisions, key) {
  return { ...decisions, [key]: { status: "approved" } };
}

// Rejection always carries a reason (spec #105's "Rejection" decision) — the
// resulting blocklist.yaml entry needs to be as specific and searchable as
// today's manually-written ones, so an empty/whitespace-only reason is
// refused rather than silently stored.
export function rejectCandidate(decisions, key, reason) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error("A rejection reason is required");
  }
  return { ...decisions, [key]: { status: "rejected", reason: trimmedReason } };
}

// Duplicate (ADR-0019): the video itself is fine, only this redundant
// discovery of it is being dropped from the run — unlike Reject, it carries
// no reason and (per computeWriteBackPayload/finishReview) never touches
// blocklist.yaml.
export function markDuplicate(decisions, key) {
  return { ...decisions, [key]: { status: "duplicate" } };
}

// Reverts a decided candidate back to pending (spec #105's "undo a decision"
// user story) — the candidate simply has no entry in `decisions` again,
// matching the never-decided starting state.
export function undoDecision(decisions, key) {
  const next = { ...decisions };
  delete next[key];
  return next;
}

export function countTotalCandidates(groups) {
  return groups.reduce((total, group) => total + group.candidates.length, 0);
}

export function countReviewed(decisions) {
  return Object.keys(decisions).length;
}

// Counts candidates left undecided (ticket #162, part of #159): "Finish
// review" no longer gates on this being zero, but still needs the count to
// name in its confirmation before setting them aside as deferred.
export function countUndecided(groups, decisions) {
  return groups.reduce(
    (total, group) =>
      total + group.candidates.filter((candidate) => decisions[candidateKey(candidate)] === undefined).length,
    0,
  );
}

// "Finish review" stays disabled until every candidate in the run has a
// decision (spec #105's "Finishing a review" decision) — checked per
// candidate rather than by comparing counts, so a decision keyed under a
// stale/unknown id can never make an incomplete run look finished.
export function isReviewComplete(groups, decisions) {
  return groups.every((group) =>
    group.candidates.every((candidate) => decisions[candidateKey(candidate)] !== undefined),
  );
}

// Computes which videos stay (approved), which go to the blocklist
// (rejected, with their reason), which are merely dropped from this run
// (duplicates, scoped by (id, source) — see ADR-0019), and which are set
// aside to resurface on a future run (deferred, also scoped by (id,
// source) for the same reason duplicates are — an undecided candidate must
// never drag out an already-approved copy that happens to share its bare
// id) for a finished review (spec #105's "Finishing a review" decision,
// extended by ticket #162/#159 to no longer require every candidate be
// decided first) — the date each blocklist entry needs is added by the
// write-back ticket that actually sends this to GitHub, not here. A
// candidate with no decision is deferred, not silently omitted —
// finishReview still has to remove it from videos.json so it can resurface
// as a fresh candidate later.
export function computeWriteBackPayload(groups, decisions) {
  const approvedIds = [];
  const rejected = [];
  const duplicates = [];
  const deferred = [];
  for (const group of groups) {
    for (const candidate of group.candidates) {
      const decision = decisions[candidateKey(candidate)];
      if (decision?.status === "approved") {
        approvedIds.push(candidate.id);
      } else if (decision?.status === "rejected") {
        rejected.push({ id: candidate.id, reason: decision.reason });
      } else if (decision?.status === "duplicate") {
        duplicates.push({ id: candidate.id, source: candidate.source });
      } else {
        deferred.push({ id: candidate.id, source: candidate.source });
      }
    }
  }
  return { approvedIds, rejected, duplicates, deferred };
}
