// Pure orchestration over an injectable GitHub client (ticket #106, part of
// #105). No real network calls live here — `client` is injected the same
// way curation/merge_live_events.py's compute_live_events takes fetch_fn,
// so this is unit-testable against a fake client (curation-review-data.test.js).
// The real client (curation-review-github-client.js) implements the
// {listOpenPulls, listDirectory, getFileContent} shape this module calls.

export async function findOpenCurationPr(client, branch) {
  const pulls = await client.listOpenPulls();
  return pulls.find((pr) => pr.headRef === branch) ?? null;
}

const PENDING_DIR = "curation/.pending";
// Exported: curation-review-writeback.js (ticket #108) writes back to these
// same two paths and imports them from here rather than redeclaring its own
// copies, so the two modules can't silently drift onto different paths.
export const VIDEOS_JSON_PATH = "docs/data/videos.json";
export const BLOCKLIST_YAML_PATH = "curation/blocklist.yaml";

// Reads the open PR's .pending/<channel>.json summaries plus that branch's
// current videos.json/blocklist.yaml off its head sha (ticket #106's read
// path — see spec #105's "Data source"/"Schema note" decisions). No
// decisions/write-back yet: this only proves every file the eventual
// write-back module will need is readable. blocklist.yaml is returned as
// raw YAML text, unparsed — nothing reads its structure until a later
// ticket needs to append to it, so no YAML-parsing dependency is pulled in
// for this one.
export async function fetchRunData(client, pr) {
  const fileNames = await client.listDirectory(pr.headSha, PENDING_DIR);
  const pendingSummaries = await Promise.all(
    fileNames.map((fileName) =>
      client
        .getFileContent(pr.headSha, `${PENDING_DIR}/${fileName}`)
        .then((text) => JSON.parse(text)),
    ),
  );
  const videosJson = JSON.parse(await client.getFileContent(pr.headSha, VIDEOS_JSON_PATH));
  const blocklistYamlText = await client.getFileContent(pr.headSha, BLOCKLIST_YAML_PATH);

  return { pendingSummaries, videosJson, blocklistYamlText };
}
