// Pure orchestration over an injectable GitHub client (ticket #106, part of
// #105). No real network calls live here — `client` is injected the same
// way curation/merge_live_events.py's compute_live_events takes fetch_fn,
// so this is unit-testable against a fake client (curation-review-data.test.js).
// The real client (curation-review-github-client.js) implements the
// {listOpenPulls, getFileContent} shape this module calls — it also
// implements listDirectory, getFileSha, updateFile and mergePull, but those
// are only used by curation-review-writeback.js.

export async function findOpenCurationPr(client, branch) {
  const pulls = await client.listOpenPulls();
  return pulls.find((pr) => pr.headRef === branch) ?? null;
}

const MAIN_BRANCH = "main";
// Exported: curation-review-writeback.js (ticket #108) writes back to these
// same two paths and imports them from here rather than redeclaring its own
// copies, so the two modules can't silently drift onto different paths.
export const VIDEOS_JSON_PATH = "docs/data/videos.json";
export const BLOCKLIST_YAML_PATH = "curation/blocklist.yaml";

// A video's (id, source) pair is unique across the current dataset (confirmed
// live: 0 collisions among 2117 records, vs. 118 bare-id collisions — see
// ticket #153), so it's a safe identity for diffing two snapshots of
// videos.json even though a bare id isn't.
function videoKey(video) {
  return JSON.stringify([video.id, video.source]);
}

// Every video present on the branch but absent from main, by (id, source) —
// the curation run's candidates for review (ticket #153, part of #150). A
// video present in main but absent from the branch is a removal, not an
// addition, and out of scope for this read path (removals bypass PR review
// entirely — curation/ARCHITECTURE.md).
export function computeAdditions(mainVideosJson, branchVideosJson) {
  const mainKeys = new Set(mainVideosJson.videos.map(videoKey));
  return branchVideosJson.videos.filter((video) => !mainKeys.has(videoKey(video)));
}

// Reads videos.json off both main and the open PR's head sha and diffs them
// to find this run's candidates, plus that branch's current blocklist.yaml
// (ticket #153's read path — see spec #105's "Data source"/"Schema note"
// decisions, and ticket #153 for why curation/.pending is no longer read:
// it's gitignored and never committed to any branch). blocklist.yaml is
// returned as raw YAML text, unparsed — nothing reads its structure until a
// later ticket needs to append to it, so no YAML-parsing dependency is
// pulled in for this one.
export async function fetchRunData(client, pr) {
  const mainVideosJson = JSON.parse(await client.getFileContent(MAIN_BRANCH, VIDEOS_JSON_PATH));
  const videosJson = JSON.parse(await client.getFileContent(pr.headSha, VIDEOS_JSON_PATH));
  const blocklistYamlText = await client.getFileContent(pr.headSha, BLOCKLIST_YAML_PATH);

  const additions = computeAdditions(mainVideosJson, videosJson);

  return { additions, videosJson, blocklistYamlText };
}
