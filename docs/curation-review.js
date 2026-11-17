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

// Decision bookkeeping (ticket #107, part of #105): `decisions` is a plain
// object keyed by candidate id, each value `{status: "approved"}` or
// `{status: "rejected", reason}`. Every function here returns a new object
// rather than mutating, the same immutable-update style as
// favorites.js's toggleFavorite.
export function approveCandidate(decisions, candidateId) {
  return { ...decisions, [candidateId]: { status: "approved" } };
}

// Rejection always carries a reason (spec #105's "Rejection" decision) — the
// resulting blocklist.yaml entry needs to be as specific and searchable as
// today's manually-written ones, so an empty/whitespace-only reason is
// refused rather than silently stored.
export function rejectCandidate(decisions, candidateId, reason) {
  const trimmedReason = reason.trim();
  if (!trimmedReason) {
    throw new Error("A rejection reason is required");
  }
  return { ...decisions, [candidateId]: { status: "rejected", reason: trimmedReason } };
}

// Reverts a decided candidate back to pending (spec #105's "undo a decision"
// user story) — the candidate simply has no entry in `decisions` again,
// matching the never-decided starting state.
export function undoDecision(decisions, candidateId) {
  const next = { ...decisions };
  delete next[candidateId];
  return next;
}

export function countTotalCandidates(groups) {
  return groups.reduce((total, group) => total + group.candidates.length, 0);
}

export function countReviewed(decisions) {
  return Object.keys(decisions).length;
}

// "Finish review" stays disabled until every candidate in the run has a
// decision (spec #105's "Finishing a review" decision) — checked per
// candidate rather than by comparing counts, so a decision keyed under a
// stale/unknown id can never make an incomplete run look finished.
export function isReviewComplete(groups, decisions) {
  return groups.every((group) =>
    group.candidates.every((candidate) => decisions[candidate.id] !== undefined),
  );
}

// Computes which videos stay (approved) vs. which go to the blocklist
// (rejected, with their reason) for a finished review (spec #105's
// "Finishing a review" decision) — the date each blocklist entry needs is
// added by the write-back ticket that actually sends this to GitHub, not
// here. Undecided candidates (a review in progress) are silently omitted;
// callers gate on isReviewComplete() before using this for real.
export function computeWriteBackPayload(groups, decisions) {
  const approvedIds = [];
  const rejected = [];
  for (const group of groups) {
    for (const candidate of group.candidates) {
      const decision = decisions[candidate.id];
      if (decision?.status === "approved") {
        approvedIds.push(candidate.id);
      } else if (decision?.status === "rejected") {
        rejected.push({ id: candidate.id, reason: decision.reason });
      }
    }
  }
  return { approvedIds, rejected };
}
