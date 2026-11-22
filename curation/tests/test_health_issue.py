"""Unit tests for health_issue.py's pure helpers.

Covers find_matching_issue (exact-title lookup against gh's fuzzy
--search results) and decide_health_update (the pass/fail ->
label-and-comment decision, ticket #70 — built generically enough for
ticket #71's CI-health issue to reuse unchanged). No gh/subprocess calls
in this module; report_run and find_or_create_issue (the I/O layer) are
exercised manually against the real `gh` CLI, same as preflight.py's
check_endpoint.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import health_issue  # noqa: E402


def test_find_matching_issue_returns_exact_title_match():
    issues = [
        {"number": 1, "title": "Curation pipeline health", "labels": []},
    ]
    assert health_issue.find_matching_issue(issues, "Curation pipeline health") == issues[0]


def test_find_matching_issue_ignores_fuzzy_search_results_that_dont_match_exactly():
    # gh's --search is substring/fuzzy, so a search for "Curation pipeline
    # health" can surface an unrelated issue that merely shares words —
    # only an exact title match should be returned.
    issues = [
        {"number": 2, "title": "Curation pipeline health dashboard ideas", "labels": []},
    ]
    assert health_issue.find_matching_issue(issues, "Curation pipeline health") is None


def test_find_matching_issue_returns_none_for_empty_list():
    assert health_issue.find_matching_issue([], "Curation pipeline health") is None


def test_find_matching_issue_picks_exact_match_among_several_results():
    issues = [
        {"number": 2, "title": "Curation pipeline health dashboard ideas", "labels": []},
        {"number": 1, "title": "Curation pipeline health", "labels": [{"name": "needs-triage"}]},
    ]
    assert health_issue.find_matching_issue(issues, "Curation pipeline health") == issues[1]


def test_decide_health_update_failing_run_not_yet_labeled_adds_needs_triage():
    decision = health_issue.decide_health_update(
        currently_labeled_needs_triage=False, run_succeeded=False, detail="Preflight check failed."
    )
    assert decision["label_action"] == "add"
    assert "Preflight check failed." in decision["comment_body"]


def test_decide_health_update_failing_run_already_labeled_does_not_re_add():
    # Re-adding a label gh already has is a no-op, but the decision should
    # say so explicitly rather than issuing a redundant gh call.
    decision = health_issue.decide_health_update(
        currently_labeled_needs_triage=True, run_succeeded=False, detail="Still failing."
    )
    assert decision["label_action"] is None


def test_decide_health_update_succeeding_run_labeled_removes_needs_triage():
    decision = health_issue.decide_health_update(
        currently_labeled_needs_triage=True, run_succeeded=True, detail="0 units used."
    )
    assert decision["label_action"] == "remove"
    assert "0 units used." in decision["comment_body"]


def test_decide_health_update_succeeding_run_not_labeled_leaves_label_alone():
    decision = health_issue.decide_health_update(
        currently_labeled_needs_triage=False, run_succeeded=True, detail="0 units used."
    )
    assert decision["label_action"] is None


def test_decide_health_update_comment_body_leads_with_pass_fail_header():
    success = health_issue.decide_health_update(
        currently_labeled_needs_triage=False, run_succeeded=True, detail="detail"
    )
    failure = health_issue.decide_health_update(
        currently_labeled_needs_triage=False, run_succeeded=False, detail="detail"
    )
    assert success["comment_body"].startswith("✅")
    assert failure["comment_body"].startswith("❌")


def test_decide_health_update_never_returns_a_close_action():
    # The standing issue is never closed by this automation — there is no
    # "close" value label_action can take.
    for run_succeeded in (True, False):
        for labeled in (True, False):
            decision = health_issue.decide_health_update(
                currently_labeled_needs_triage=labeled, run_succeeded=run_succeeded, detail="x"
            )
            assert decision["label_action"] in (None, "add", "remove")
