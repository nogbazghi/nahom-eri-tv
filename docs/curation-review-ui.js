// Wires the pure curation-review logic (curation-review.js,
// curation-review-data.js) up to the DOM and the real GitHub client
// (curation-review-github-client.js): reads/writes the stored PAT, drives
// the read path, and renders the dense candidate list. Untested glue, same
// role as favorites-ui.js — verified by running the page against a real PR.
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
import { findOpenCurationPr, fetchRunData } from "./curation-review-data.js";
import { createGithubClient } from "./curation-review-github-client.js";
import { finishReview } from "./curation-review-writeback.js";

const STORAGE_KEY = "eriTvCurationReviewPat";
const STANDING_BRANCH = "curation/weekly-update";

const tokenForm = document.getElementById("pat-form");
const tokenInput = document.getElementById("pat-input");
const statusMessage = document.getElementById("status-message");
const candidateGroupsEl = document.getElementById("candidate-groups");
const progressMessageEl = document.getElementById("progress-message");
const finishReviewBtn = document.getElementById("finish-review-btn");

// Review-run state (tickets #107/#108, part of #105): `groups` is set once
// per loaded run and never mutated; `decisions` and `openReasonFormIds` are
// rebuilt immutably on every change, same style as favorites-ui.js's
// module-level `favorites`. `client` and `runData` (pr/videosJson/
// blocklistYamlText) are kept so Finish review can hand them straight to
// curation-review-writeback.js's finishReview without re-fetching.
let groups = [];
let decisions = {};
// Candidate ids whose inline rejection-reason field is currently open —
// local UI presentation state, not a review decision, so it lives here
// rather than in curation-review.js's pure decisions shape.
let openReasonFormIds = new Set();
let client = null;
let runData = null;

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

function showReviewControls() {
  progressMessageEl.hidden = false;
  finishReviewBtn.hidden = false;
}

function hideReviewControls() {
  progressMessageEl.hidden = true;
  finishReviewBtn.hidden = true;
}

// Approve/Undo act immediately; Reject instead opens an inline reason field
// (spec #105's UI baseline) — `onReject` just toggles that field open, the
// decision itself is only recorded once the reviewer confirms with a
// non-empty reason via `onConfirmReject`.
function buildCandidateActions(candidate, decision, reasonFormOpen, handlers) {
  const actions = document.createElement("div");
  actions.className = "candidate-actions";

  if (decision === undefined) {
    if (!reasonFormOpen) {
      const approveBtn = document.createElement("button");
      approveBtn.type = "button";
      approveBtn.className = "approve-btn";
      approveBtn.textContent = "Approve";
      approveBtn.addEventListener("click", () => handlers.onApprove(candidate.id));
      actions.appendChild(approveBtn);

      const rejectBtn = document.createElement("button");
      rejectBtn.type = "button";
      rejectBtn.className = "reject-btn";
      rejectBtn.textContent = "Reject";
      rejectBtn.addEventListener("click", () => handlers.onReject(candidate.id));
      actions.appendChild(rejectBtn);
      return actions;
    }

    actions.classList.add("reject-form");

    const label = document.createElement("label");
    const reasonInput = document.createElement("textarea");
    reasonInput.className = "reject-reason-input";
    label.textContent = "Reason for rejecting (required)";
    label.appendChild(reasonInput);
    actions.appendChild(label);

    const error = document.createElement("p");
    error.className = "reject-reason-error";
    error.hidden = true;
    actions.appendChild(error);

    const confirmBtn = document.createElement("button");
    confirmBtn.type = "button";
    confirmBtn.className = "confirm-reject-btn";
    confirmBtn.textContent = "Confirm reject";
    confirmBtn.addEventListener("click", () => {
      if (!reasonInput.value.trim()) {
        error.textContent = "A reason is required to reject this candidate.";
        error.hidden = false;
        return;
      }
      handlers.onConfirmReject(candidate.id, reasonInput.value);
    });
    actions.appendChild(confirmBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "cancel-reject-btn";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => handlers.onCancelReject(candidate.id));
    actions.appendChild(cancelBtn);
    return actions;
  }

  const status = document.createElement("span");
  status.className = "decision-status";
  status.textContent =
    decision.status === "approved" ? "Approved" : `Rejected — ${decision.reason}`;
  actions.appendChild(status);

  const undoBtn = document.createElement("button");
  undoBtn.type = "button";
  undoBtn.className = "undo-btn";
  undoBtn.textContent = "Undo";
  undoBtn.addEventListener("click", () => handlers.onUndo(candidate.id));
  actions.appendChild(undoBtn);

  return actions;
}

function buildCandidateRow(candidate, decision, reasonFormOpen, handlers) {
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
  li.appendChild(buildCandidateActions(candidate, decision, reasonFormOpen, handlers));
  return li;
}

function renderGroups(handlers) {
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
      list.appendChild(
        buildCandidateRow(
          candidate,
          decisions[candidate.id],
          openReasonFormIds.has(candidate.id),
          handlers,
        ),
      );
    }
    section.appendChild(list);

    candidateGroupsEl.appendChild(section);
  }
}

function renderProgress() {
  progressMessageEl.textContent = `${countReviewed(decisions)}/${countTotalCandidates(groups)} reviewed`;
}

function renderFinishButton() {
  finishReviewBtn.disabled = !isReviewComplete(groups, decisions);
}

function closeReasonForm(candidateId) {
  openReasonFormIds = new Set(openReasonFormIds);
  openReasonFormIds.delete(candidateId);
}

// Single re-render entry point called after every decision/form-state
// change — rebuilds the candidate list, progress count, and Finish review
// button's enabled state together so none of the three can drift out of
// sync with the others.
function rerender() {
  renderGroups({
    onApprove: (candidateId) => {
      decisions = approveCandidate(decisions, candidateId);
      rerender();
    },
    onReject: (candidateId) => {
      openReasonFormIds = new Set(openReasonFormIds).add(candidateId);
      rerender();
    },
    onConfirmReject: (candidateId, reason) => {
      decisions = rejectCandidate(decisions, candidateId, reason);
      closeReasonForm(candidateId);
      rerender();
    },
    onCancelReject: (candidateId) => {
      closeReasonForm(candidateId);
      rerender();
    },
    onUndo: (candidateId) => {
      decisions = undoDecision(decisions, candidateId);
      rerender();
    },
  });
  renderProgress();
  renderFinishButton();
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
  hideReviewControls();

  client = createGithubClient(token);

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

  try {
    runData = await fetchRunData(client, pr);
  } catch (error) {
    handleGithubError(error, "Couldn't read the run's data");
    return;
  }
  runData.pr = pr;

  groups = groupCandidatesByChannel(runData.additions);
  if (groups.length === 0) {
    showStatus("The open curation PR has no candidates to review.");
    return;
  }

  decisions = {};
  openReasonFormIds = new Set();

  hideStatus();
  showReviewControls();
  rerender();
}

function showTokenForm() {
  tokenForm.hidden = false;
}

function hideTokenForm() {
  tokenForm.hidden = true;
}

// Finishing a review (ticket #108, part of #105): commits the rejected
// candidates' removal from videos.json and their blocklist.yaml entries to
// the standing branch, then merges the run's PR — the one moment approved
// additions actually reach main. Disabled for the duration of the call so
// a double-click can't send the merge twice.
finishReviewBtn.addEventListener("click", async () => {
  const payload = computeWriteBackPayload(groups, decisions);
  const today = new Date().toISOString().slice(0, 10);

  finishReviewBtn.disabled = true;
  finishReviewBtn.textContent = "Publishing…";
  showStatus("Publishing review to GitHub…");

  try {
    await finishReview(client, runData, payload, today);
  } catch (error) {
    finishReviewBtn.textContent = "Finish review";
    renderFinishButton();
    handleGithubError(error, "Couldn't publish the review");
    return;
  }

  hideReviewControls();
  candidateGroupsEl.replaceChildren();
  showStatus(
    `Review published: ${payload.approvedIds.length} approved, ${payload.rejected.length} rejected.`,
  );
});

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
