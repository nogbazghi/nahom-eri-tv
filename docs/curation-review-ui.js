// Wires the pure curation-review logic (curation-review.js,
// curation-review-data.js) up to the DOM and the real GitHub client
// (curation-review-github-client.js): reads/writes the stored PAT, drives
// the read path, and renders the dense candidate list. Untested glue, same
// role as favorites-ui.js — verified by running the page against a real PR.
import { formatDuration, buildThumbnailUrl, buildYoutubeUrl, groupCandidatesByChannel } from "./curation-review.js";
import { findOpenCurationPr, fetchRunData } from "./curation-review-data.js";
import { createGithubClient } from "./curation-review-github-client.js";

const STORAGE_KEY = "eriTvCurationReviewPat";
const STANDING_BRANCH = "curation/weekly-update";

const tokenForm = document.getElementById("pat-form");
const tokenInput = document.getElementById("pat-input");
const statusMessage = document.getElementById("status-message");
const candidateGroupsEl = document.getElementById("candidate-groups");

function readStoredToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private browsing / storage disabled: fail safe to no stored token.
    return null;
  }
}

function persistToken(token) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Nothing more we can do if storage is unavailable; the token still
    // works for this page view, it just won't be remembered next visit.
  }
}

function clearStoredToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing more we can do if storage is unavailable.
  }
}

function showStatus(text) {
  statusMessage.textContent = text;
  statusMessage.hidden = false;
}

function hideStatus() {
  statusMessage.hidden = true;
}

function buildCandidateRow(candidate) {
  const li = document.createElement("li");
  li.className = "candidate-row";

  const thumbnail = document.createElement("img");
  thumbnail.className = "candidate-thumbnail";
  thumbnail.src = buildThumbnailUrl(candidate.id);
  thumbnail.alt = "";
  thumbnail.loading = "lazy";
  li.appendChild(thumbnail);

  const info = document.createElement("div");
  info.className = "candidate-info";

  const title = document.createElement("p");
  title.className = "candidate-title";
  title.textContent = candidate.title;
  info.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "candidate-meta";
  meta.textContent = `${candidate.channel} · ${formatDuration(candidate.duration)}`;
  info.appendChild(meta);

  const link = document.createElement("a");
  link.href = buildYoutubeUrl(candidate.id);
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Watch on YouTube";
  info.appendChild(link);

  li.appendChild(info);
  return li;
}

function renderGroups(groups) {
  candidateGroupsEl.replaceChildren();
  for (const group of groups) {
    const section = document.createElement("section");
    section.className = "channel-group";

    const heading = document.createElement("h2");
    heading.textContent = group.channel;
    section.appendChild(heading);

    const list = document.createElement("ul");
    list.className = "candidate-list";
    for (const candidate of group.candidates) {
      list.appendChild(buildCandidateRow(candidate));
    }
    section.appendChild(list);

    candidateGroupsEl.appendChild(section);
  }
}

// A rejected token (expired/revoked/mistyped) would otherwise leave the
// reviewer stuck forever: readStoredToken() finds it, loadRun() keeps
// failing the same way on every reload, and there's no UI path back to the
// token form short of clearing localStorage by hand. Any 401 clears the
// stored token and brings the form back instead.
function handleGithubError(error, context) {
  if (error.status === 401) {
    clearStoredToken();
    showTokenForm();
    showStatus(`That GitHub token was rejected — enter a new one. (${context})`);
    return;
  }
  showStatus(`${context}: ${error.message}`);
}

async function loadRun(token) {
  showStatus("Loading current run…");
  candidateGroupsEl.replaceChildren();

  const client = createGithubClient(token);

  let pr;
  try {
    pr = await findOpenCurationPr(client, STANDING_BRANCH);
  } catch (error) {
    handleGithubError(error, "Couldn't reach GitHub");
    return;
  }

  if (pr === null) {
    showStatus("No open curation PR right now — nothing to review.");
    return;
  }

  let runData;
  try {
    runData = await fetchRunData(client, pr);
  } catch (error) {
    handleGithubError(error, "Couldn't read the run's data");
    return;
  }

  const groups = groupCandidatesByChannel(runData.pendingSummaries);
  if (groups.length === 0) {
    showStatus("The open curation PR has no candidates to review.");
    return;
  }

  hideStatus();
  renderGroups(groups);
}

function showTokenForm() {
  tokenForm.hidden = false;
}

function hideTokenForm() {
  tokenForm.hidden = true;
}

tokenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token) return;
  persistToken(token);
  tokenInput.value = "";
  hideTokenForm();
  loadRun(token);
});

const storedToken = readStoredToken();
if (storedToken) {
  hideTokenForm();
  loadRun(storedToken);
} else {
  showTokenForm();
}
