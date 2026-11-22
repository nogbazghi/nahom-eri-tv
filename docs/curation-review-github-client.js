// Real GitHub REST API client, scoped to this one repo (spec #105's
// "Reviewer / auth" decision: a fine-grained PAT scoped to just this
// repository, kept in the browser, no backend service). Implements the
// {listOpenPulls, listDirectory, getFileContent} shape curation-review-data.js
// calls, plus the {getFileSha, updateFile, mergePull} shape
// curation-review-writeback.js calls — untested glue, same role as
// favorites-ui.js/i18n-ui.js, verified by running the page against a real
// PR (ticket #106's "prove the read path end to end", ticket #108's write
// path).

const OWNER = "nogbazghi";
const REPO = "nahom-eri-tv";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

class GithubApiError extends Error {
  constructor(status, path) {
    super(`GitHub API error ${status} for ${path}`);
    this.status = status;
  }
}

// Goes through TextEncoder/byte-string rather than a plain btoa(text), so a
// reason containing non-ASCII text round-trips correctly rather than btoa
// throwing on it.
function encodeBase64Content(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

export function createGithubClient(token) {
  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      body: options.body,
      headers: {
        Authorization: `Bearer ${token}`,
        // The raw media type returns the file's actual bytes instead of a
        // JSON-wrapped base64 field, up to 100MB — the default media type's
        // Contents API wrapper omits `content` entirely (empty string, not
        // valid base64) once a file exceeds its 1MB inline-content limit,
        // which JSON.parse(atob(...)) then fails on with "Unexpected EOF".
        Accept: options.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (!response.ok) {
      throw new GithubApiError(response.status, path);
    }
    return options.raw ? response.text() : response.json();
  }

  return {
    async listOpenPulls() {
      const pulls = await request("/pulls?state=open");
      return pulls.map((pr) => ({
        number: pr.number,
        headRef: pr.head.ref,
        headSha: pr.head.sha,
        htmlUrl: pr.html_url,
      }));
    },

    // Returns [] rather than throwing when the directory doesn't exist on
    // this branch (e.g. a removals-only run left .pending empty) — the
    // caller treats that the same as "no candidates", not an error.
    async listDirectory(ref, path) {
      try {
        const entries = await request(`/contents/${path}?ref=${ref}`);
        return entries.map((entry) => entry.name);
      } catch (error) {
        if (error instanceof GithubApiError && error.status === 404) {
          return [];
        }
        throw error;
      }
    },

    async getFileContent(ref, path) {
      return request(`/contents/${path}?ref=${ref}`, { raw: true });
    },

    // The Contents API's update endpoint needs the current file's blob
    // sha to accept an update (it 409s against a stale one) — fetched
    // fresh right before the write rather than reused from an earlier
    // read, since by curation-review-writeback.js's call time that read
    // may be stale.
    async getFileSha(ref, path) {
      const file = await request(`/contents/${path}?ref=${ref}`);
      return file.sha;
    },

    async updateFile(branch, path, content, sha, message) {
      await request(`/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify({ message, content: encodeBase64Content(content), sha, branch }),
      });
    },

    async mergePull(number) {
      await request(`/pulls/${number}/merge`, { method: "PUT" });
    },
  };
}
