// Real GitHub REST API client, scoped to this one repo (spec #105's
// "Reviewer / auth" decision: a fine-grained PAT scoped to just this
// repository, kept in the browser, no backend service). Implements the
// {listOpenPulls, listDirectory, getFileContent} shape curation-review-data.js
// calls — untested glue, same role as favorites-ui.js/i18n-ui.js, verified
// by running the page against a real PR (ticket #106's "prove the read path
// end to end").

const OWNER = "nogbazghi";
const REPO = "nahom-eri-tv";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

class GithubApiError extends Error {
  constructor(status, path) {
    super(`GitHub API error ${status} for ${path}`);
    this.status = status;
  }
}

function decodeBase64Content(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8").decode(bytes);
}

export function createGithubClient(token) {
  async function request(path) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!response.ok) {
      throw new GithubApiError(response.status, path);
    }
    return response.json();
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
      const file = await request(`/contents/${path}?ref=${ref}`);
      return decodeBase64Content(file.content);
    },
  };
}
