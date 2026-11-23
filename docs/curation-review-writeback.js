// GitHub write-back module (ticket #108, part of #105): once a review is
// finished, commits the computed write-back payload (docs/curation-review.js's
// computeWriteBackPayload) to the standing branch and merges its PR — the
// one moment approved additions actually reach main. Async orchestration
// over an injectable GitHub client, the same shape as
// merge_live_events.py's fetch_fn injection and docs/curation-review-data.js's
// client — no DOM, exercised with a fake client in
// curation-review-writeback.test.js rather than any real network call.

import { VIDEOS_JSON_PATH, BLOCKLIST_YAML_PATH } from "./curation-review-data.js";

// Removes every video matching a `{id}` (rejected) or `{id, source}`
// (duplicate) entry in `toRemove`. A missing `source` matches any source for
// that id — Reject's existing meaning is unchanged: a rejected video is
// excluded globally, by id alone, so any other candidate in this same run
// sharing that id (another discovery of the same actual video) goes with
// it. A present `source` matches exactly — Duplicate (ADR-0019) must drop
// only the one redundant discovery, never a co-candidate that shares its id
// but was independently approved.
export function removeRejectedFromVideosJson(videosJson, toRemove) {
  return {
    ...videosJson,
    videos: videosJson.videos.filter(
      (video) =>
        !toRemove.some(
          (item) => video.id === item.id && (item.source === undefined || video.source === item.source),
        ),
    ),
  };
}

// Matches curation/blocklist.yaml's existing hand-written entry shape
// exactly (`- id: ...\n  reason: "..."\n  date: ...\n`) — JSON.stringify
// gives the reason a double-quoted YAML scalar with the same backslash/
// quote escaping YAML itself requires for that style, with no extra
// dependency needed to serialize just this one shape.
//
// Skips a candidate already present (by id) rather than appending it
// again — finishReview re-reads this file fresh right before calling
// here, so if an earlier attempt's blocklist commit succeeded but a later
// step (the merge, say) then failed, retrying converges instead of
// duplicating that entry.
export function appendBlocklistEntries(blocklistYamlText, rejected, today) {
  const newRejections = rejected.filter(({ id }) => !blocklistYamlText.includes(`- id: ${id}\n`));
  if (newRejections.length === 0) {
    return blocklistYamlText;
  }
  const base = blocklistYamlText.endsWith("\n") ? blocklistYamlText : `${blocklistYamlText}\n`;
  const entries = newRejections
    .map(({ id, reason }) => `- id: ${id}\n  reason: ${JSON.stringify(reason)}\n  date: ${today}\n`)
    .join("");
  return `${base}\n${entries}`;
}

// Finishing a review (spec #105's "Finishing a review" decision, extended by
// ADR-0019's Duplicate disposition): rewrites the standing branch — removes
// rejected and duplicate candidates from that branch's videos.json in one
// pass, appends blocklist.yaml entries only for the rejected ones (a
// Duplicate never touches the blocklist — the video itself is fine) — then
// merges the PR. Only the merge actually publishes anything to main; when
// there's nothing to remove, the branch's videos.json is already correct
// as-is (ticket #106's automated run wrote the candidates straight into
// it), so no commit is needed before merging.
export async function finishReview(client, runData, writeBackPayload, today) {
  const { pr, videosJson } = runData;
  const { rejected, duplicates } = writeBackPayload;
  const toRemove = [...rejected, ...duplicates];

  if (toRemove.length > 0) {
    const newVideosJson = removeRejectedFromVideosJson(videosJson, toRemove);
    const videosSha = await client.getFileSha(pr.headRef, VIDEOS_JSON_PATH);
    await client.updateFile(
      pr.headRef,
      VIDEOS_JSON_PATH,
      JSON.stringify(newVideosJson, null, 2),
      videosSha,
      "Remove rejected and duplicate curation candidates",
    );
  }

  if (rejected.length > 0) {
    // Read the branch's current blocklist.yaml fresh here, rather than
    // trusting whatever runData's load-time snapshot held — if a prior
    // finish attempt already committed this append but failed on a later
    // step (the merge, say), appendBlocklistEntries' already-present
    // check converges instead of duplicating it on retry.
    const currentBlocklistYaml = await client.getFileContent(pr.headRef, BLOCKLIST_YAML_PATH);
    const newBlocklistYaml = appendBlocklistEntries(currentBlocklistYaml, rejected, today);
    if (newBlocklistYaml !== currentBlocklistYaml) {
      const blocklistSha = await client.getFileSha(pr.headRef, BLOCKLIST_YAML_PATH);
      await client.updateFile(
        pr.headRef,
        BLOCKLIST_YAML_PATH,
        newBlocklistYaml,
        blocklistSha,
        "Append rejected curation candidates to blocklist.yaml",
      );
    }
  }

  await client.mergePull(pr.number);
}
