"""Standing GitHub issue reporting for an automated run (ticket #70).

decide_health_update is the pure pass/fail -> label-and-comment decision,
kept deliberately generic (its only concern-specific input is `detail`)
so ticket #71's CI-health issue can reuse it unchanged for a second
concern instead of reimplementing equivalent logic. find_matching_issue
and the I/O layer below it (find_or_create_issue, report_run) are
curation-specific orchestration around that decision, talking to GitHub
through the `gh` CLI the same way the rest of this project's automation
does (see docs/agents/issue-tracker.md).

Usage:
    from health_issue import report_run
    report_run(title="Curation pipeline health", run_succeeded=..., detail=...)

Called from curate.yml (cwd=curation/) for the curation concern (#70),
and from test.yml's report-main-health job (also cwd=curation/, checked
out fresh for that job since it isn't part of the curation pipeline) for
the CI-on-push-to-main concern (#71) — same title/run_succeeded/detail
contract, a different `title`.
"""

import json
import subprocess

NEEDS_TRIAGE_LABEL = "needs-triage"


def decide_health_update(*, currently_labeled_needs_triage, run_succeeded, detail):
    """Pure function — no gh calls, no I/O.

    Given only whether the standing issue currently carries
    needs-triage and whether this run succeeded or failed, decides what
    its next comment should say and whether that label should change.
    `detail` is the one piece of information specific to the calling
    concern (this ticket's quota estimate or failure reason; #71's CI
    failure description) — everything else here is shared.

    Returns {"label_action": "add" | "remove" | None, "comment_body": str}.
    A failing run adds needs-triage only if it isn't already present (no
    redundant re-add); a succeeding run removes it only if present (no
    redundant removal); a run that doesn't change the situation returns
    label_action=None. Never signals closing the issue — that's not a
    label action this function produces, and report_run never calls
    `gh issue close`.
    """
    if run_succeeded:
        label_action = "remove" if currently_labeled_needs_triage else None
        header = "✅ Run succeeded."
    else:
        label_action = None if currently_labeled_needs_triage else "add"
        header = "❌ Run failed."

    comment_body = f"{header}\n\n{detail}" if detail else header
    return {"label_action": label_action, "comment_body": comment_body}


def summarize_job_results(results, run_url):
    """Pure. `results` maps a CI job's name to its GitHub Actions `result`
    string. Returns (run_succeeded, detail): run_succeeded is True only if
    every job succeeded; detail names the failing jobs (or says all passed)
    followed by `run_url`, ready to pass as report_run's `detail`."""
    run_succeeded = all(result == "success" for result in results.values())
    if run_succeeded:
        detail = f"All test suites passed on main. {run_url}"
    else:
        failed = [name for name, result in results.items() if result != "success"]
        detail = f"Failed on main: {', '.join(failed)}. {run_url}"
    return run_succeeded, detail


def find_matching_issue(issues, title):
    """Pure. First issue in `issues` (as returned by `gh issue list --json
    number,title,labels`) whose title exactly equals `title`, or None.
    gh's --search is a fuzzy/substring match, so exact matching happens
    here rather than trusting the search results directly."""
    for issue in issues:
        if issue.get("title") == title:
            return issue
    return None


def _run_gh(args):
    result = subprocess.run(["gh", *args], capture_output=True, text=True, check=True)
    return result.stdout


def find_or_create_issue(title):
    """I/O. Return {"number": int, "labels": [str, ...]} for the standing
    issue titled exactly `title` — the existing one (open or closed) if
    `gh issue list` finds it, freshly created otherwise. Never closes or
    reopens an existing issue."""
    raw = _run_gh(
        [
            "issue",
            "list",
            "--search",
            f'"{title}" in:title',
            "--state",
            "all",
            "--json",
            "number,title,labels",
        ]
    )
    existing = find_matching_issue(json.loads(raw), title)
    if existing:
        return {"number": existing["number"], "labels": [label["name"] for label in existing["labels"]]}

    raw = _run_gh(
        [
            "issue",
            "create",
            "--title",
            title,
            "--body",
            "Standing issue for automated run reports. One comment per run; never closed by automation.",
        ]
    )
    number = int(raw.strip().rsplit("/", 1)[-1])
    return {"number": number, "labels": []}


def report_run(*, title, run_succeeded, detail):
    """I/O. Find-or-create the standing issue titled `title`, append one
    comment for this run per decide_health_update's decision, and
    add/remove needs-triage accordingly. Never closes the issue."""
    issue = find_or_create_issue(title)
    decision = decide_health_update(
        currently_labeled_needs_triage=NEEDS_TRIAGE_LABEL in issue["labels"],
        run_succeeded=run_succeeded,
        detail=detail,
    )
    _run_gh(["issue", "comment", str(issue["number"]), "--body", decision["comment_body"]])
    if decision["label_action"] == "add":
        _run_gh(["issue", "edit", str(issue["number"]), "--add-label", NEEDS_TRIAGE_LABEL])
    elif decision["label_action"] == "remove":
        _run_gh(["issue", "edit", str(issue["number"]), "--remove-label", NEEDS_TRIAGE_LABEL])
