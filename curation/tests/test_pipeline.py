"""Unit tests for pipeline.py's shared pure helper functions.

Covers the logic consolidated out of discover.py and kebire_channel.py
(dropping already-stored/blocklisted candidate IDs, locating a channel's
stored videos by membership, extracting validate_record's rules subset
from a channels.yaml entry), validate_record, compute_run,
write_channel_result, and the workflow-facing load_pending_summaries.
No network calls — compute_run is exercised with a fake fetch_fn, never
the real fetch_video_metadata.
"""

import datetime
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pipeline  # noqa: E402

RULES = {"view_count_min": 100, "duration_min_sec": 60}


def test_parse_duration_treats_in_progress_livestream_as_zero_seconds():
    # YouTube's videos.list API reports contentDetails.duration as "P0D"
    # (no "PT" time designator) for a livestream that hasn't ended yet,
    # rather than a normal "PTnHnMnS" value.
    assert pipeline.parse_duration("P0D") == 0


def make_record(**overrides):
    record = {
        "title": "A Video",
        "channel": "Some Channel",
        "description": "",
        "published": "2026-01-01",
        "duration": 120,
        "public": True,
        "embeddable": True,
        "view_count": 500,
    }
    record.update(overrides)
    return record


def test_filter_new_ids_drops_stored_and_blocklisted():
    candidates = ["a", "b", "c", "d"]
    stored_ids = ["b"]
    blocked_ids = {"d"}
    assert pipeline.filter_new_ids(candidates, stored_ids, blocked_ids) == ["a", "c"]


def test_filter_new_ids_keeps_everything_when_nothing_excluded():
    assert pipeline.filter_new_ids(["a", "b"], [], set()) == ["a", "b"]


def test_filter_new_ids_empty_input():
    assert pipeline.filter_new_ids([], set(), set()) == []


def test_rules_from_config_extracts_documented_thresholds_only():
    cfg = {
        "display_name": "Weddings",
        "type": "search",
        "queries": ["Tigrinya wedding"],
        "view_count_min": 500,
        "duration_min_sec": 120,
    }
    assert pipeline.rules_from_config(cfg) == {"view_count_min": 500, "duration_min_sec": 120}


def test_rules_from_config_defaults_missing_thresholds_to_zero():
    assert pipeline.rules_from_config({"display_name": "X"}) == {
        "view_count_min": 0,
        "duration_min_sec": 0,
    }


def test_validate_record_missing_fails_as_removed():
    assert pipeline.validate_record({"missing": True}, RULES) == (False, "removed")


def test_validate_record_private_fails():
    record = make_record(public=False)
    assert pipeline.validate_record(record, RULES) == (False, "private")


def test_validate_record_not_embeddable_fails():
    record = make_record(embeddable=False)
    assert pipeline.validate_record(record, RULES) == (False, "not embeddable")


def test_validate_record_too_short_fails():
    record = make_record(duration=RULES["duration_min_sec"] - 1)
    assert pipeline.validate_record(record, RULES) == (False, "too short")


def test_validate_record_too_few_views_fails():
    record = make_record(view_count=RULES["view_count_min"] - 1)
    assert pipeline.validate_record(record, RULES) == (False, "too few views")


def test_validate_record_passing_record_returns_true():
    record = make_record(
        public=True,
        embeddable=True,
        duration=RULES["duration_min_sec"],
        view_count=RULES["view_count_min"],
    )
    assert pipeline.validate_record(record, RULES) == (True, None)


def test_videos_for_channel_returns_only_matching_videos():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Kebire"], "source": "kebire"},
            {"id": "2", "channels": ["Other Channel"], "source": "other"},
            {"id": "3", "channels": ["Kebire"], "source": "kebire"},
        ]
    }
    result = pipeline.videos_for_channel(existing_data, display_name="Kebire", source="kebire")
    assert result == [
        {"id": "1", "channels": ["Kebire"], "source": "kebire"},
        {"id": "3", "channels": ["Kebire"], "source": "kebire"},
    ]


def test_videos_for_channel_excludes_a_different_sources_videos_under_the_same_display_name():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Sports"], "source": "sports_eritv"},
            {"id": "2", "channels": ["Sports"], "source": "sports_diaspora"},
        ]
    }
    result = pipeline.videos_for_channel(
        existing_data, display_name="Sports", source="sports_eritv"
    )
    assert result == [{"id": "1", "channels": ["Sports"], "source": "sports_eritv"}]


def test_compute_run_blocklisted_stored_video_removed_without_api_call():
    stored_videos = [{"id": "blocked1", "title": "Old Video", "channels": ["Weddings"]}]

    def fetch_fn(ids, api_key):
        raise AssertionError("fetch_fn should not be called for blocklisted-only stored videos")

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=[],
        rules=RULES,
        api_key="key",
        blocked_ids={"blocked1"},
        fetch_fn=fetch_fn,
    )

    assert result["removals"] == [{"id": "blocked1", "title": "Old Video", "reason": "blocklisted"}]
    assert result["final_videos"] == []


def test_compute_run_video_missing_from_api_response_is_treated_as_removed():
    stored_videos = [{"id": "v1", "title": "Video 1", "channels": ["Weddings"]}]

    def fetch_fn(ids, api_key):
        return {}

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=[],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )

    assert result["removals"] == [{"id": "v1", "title": "Video 1", "reason": "removed"}]
    assert result["final_videos"] == []


def test_compute_run_already_stored_candidate_id_is_skipped():
    stored_videos = [{"id": "v1", "title": "Video 1", "channels": ["Weddings"]}]
    fetch_calls = []

    def fetch_fn(ids, api_key):
        fetch_calls.append(list(ids))
        return {vid: make_record(title=f"Title {vid}") for vid in ids}

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=["v1", "v2"],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )

    # v1 is only ever refetched as a stored video, never re-fetched as a candidate.
    assert fetch_calls == [["v1"], ["v2"]]
    assert [a["id"] for a in result["additions"]] == ["v2"]
    assert [v["id"] for v in result["final_videos"]] == ["v1", "v2"]


def test_compute_run_stamps_source_as_the_calling_channel_key_on_new_additions():
    def fetch_fn(ids, api_key):
        return {vid: make_record(title=f"Title {vid}") for vid in ids}

    result = pipeline.compute_run(
        channel_key="sports_eritv",
        display_name="Sports",
        stored_videos=[],
        fresh_candidate_ids=["v1"],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )

    assert result["additions"][0]["source"] == "sports_eritv"
    assert result["final_videos"][0]["source"] == "sports_eritv"


def test_compute_run_failing_new_candidate_is_dropped_silently():
    def fetch_fn(ids, api_key):
        return {}  # candidate missing from the API response -> fails validation

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=[],
        fresh_candidate_ids=["bad1"],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )

    # The videos.list call still happened (one batch, for "bad1") even
    # though the candidate failed validation — the call cost quota
    # regardless of the outcome.
    assert result == {
        "final_videos": [],
        "additions": [],
        "removals": [],
        "api_calls": {"videos.list": 1},
    }


def test_compute_run_api_calls_counts_both_the_refetch_and_candidate_batches():
    stored_videos = [{"id": "v1", "title": "Video 1", "channels": ["Weddings"]}]

    def fetch_fn(ids, api_key):
        return {vid: make_record(title=f"Title {vid}") for vid in ids}

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=["v2", "v3"],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )

    # One batch call to re-fetch stored ["v1"], one batch call to fetch
    # new candidates ["v2", "v3"] — both well under the 50-ID batch size.
    assert result["api_calls"] == {"videos.list": 2}


def test_compute_run_api_calls_zero_when_nothing_needs_fetching():
    stored_videos = [{"id": "blocked1", "title": "Old Video", "channels": ["Weddings"]}]

    def fail_if_called(ids, api_key):
        raise AssertionError("fetch_fn should not be called")

    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=["blocked1"],
        rules=RULES,
        api_key="key",
        blocked_ids={"blocked1"},
        fetch_fn=fail_if_called,
    )

    assert result["api_calls"] == {"videos.list": 0}


def test_compute_run_stamps_last_validated_on_every_kept_and_added_record():
    stored_videos = [{"id": "v1", "title": "Old Title", "channels": ["Weddings"]}]

    def fetch_fn(ids, api_key):
        return {vid: make_record(title=f"Title {vid}") for vid in ids}

    before = datetime.datetime.now(datetime.timezone.utc)
    result = pipeline.compute_run(
        channel_key="weddings",
        display_name="Weddings",
        stored_videos=stored_videos,
        fresh_candidate_ids=["v2"],
        rules=RULES,
        api_key="key",
        blocked_ids=set(),
        fetch_fn=fetch_fn,
    )
    after = datetime.datetime.now(datetime.timezone.utc)

    assert len(result["final_videos"]) == 2
    for video in result["final_videos"]:
        stamp = datetime.datetime.fromisoformat(video["lastValidated"])
        assert before <= stamp <= after


def test_write_channel_result_replaces_only_named_channels_videos():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Kebire"], "source": "kebire"},
            {"id": "2", "channels": ["Other Channel"], "source": "other"},
        ],
        "schedules": {"Kebire": {"scheduleStart": "2026-01-01T00:00:00+00:00"}},
    }
    final_videos = [{"id": "3", "channels": ["Kebire"], "source": "kebire"}]

    result = pipeline.write_channel_result(
        existing_data,
        display_name="Kebire",
        source="kebire",
        final_videos=final_videos,
        is_default=False,
    )

    assert result["videos"] == [
        {"id": "2", "channels": ["Other Channel"], "source": "other"},
        {"id": "3", "channels": ["Kebire"], "source": "kebire"},
    ]
    assert result["schedules"]["Kebire"]["scheduleStart"] == "2026-01-01T00:00:00+00:00"


def test_write_channel_result_replaces_only_the_calling_sources_slice_of_a_shared_display_name():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Sports"], "source": "sports_eritv"},
            {"id": "2", "channels": ["Sports"], "source": "sports_diaspora"},
        ],
        "schedules": {},
    }
    final_videos = [{"id": "3", "channels": ["Sports"], "source": "sports_eritv"}]

    result = pipeline.write_channel_result(
        existing_data,
        display_name="Sports",
        source="sports_eritv",
        final_videos=final_videos,
        is_default=False,
    )

    assert result["videos"] == [
        {"id": "2", "channels": ["Sports"], "source": "sports_diaspora"},
        {"id": "3", "channels": ["Sports"], "source": "sports_eritv"},
    ]


def test_write_channel_result_leaves_other_channels_schedule_untouched():
    existing_data = {
        "videos": [],
        "schedules": {
            "Other Channel": {"scheduleStart": "2025-01-01T00:00:00+00:00", "default": True}
        },
    }

    result = pipeline.write_channel_result(
        existing_data, display_name="Weddings", source="weddings", final_videos=[], is_default=False
    )

    assert result["schedules"]["Other Channel"] == {
        "scheduleStart": "2025-01-01T00:00:00+00:00",
        "default": True,
    }


def test_write_channel_result_schedule_start_and_default_set_once_and_preserved():
    existing_data = {"videos": [], "schedules": {}}

    first = pipeline.write_channel_result(
        existing_data, display_name="Weddings", source="weddings", final_videos=[], is_default=True
    )
    first_schedule = dict(first["schedules"]["Weddings"])

    assert first_schedule["default"] is True
    assert "scheduleStart" in first_schedule

    second = pipeline.write_channel_result(
        first, display_name="Weddings", source="weddings", final_videos=[], is_default=False
    )

    assert second["schedules"]["Weddings"] == first_schedule


def test_load_pending_summaries_reads_every_file_sorted_by_path(tmp_path):
    (tmp_path / "weddings.json").write_text(
        json.dumps({"channel": "weddings", "additions": [{"id": "a1"}], "removals": []})
    )
    (tmp_path / "kebire.json").write_text(
        json.dumps({"channel": "kebire", "additions": [], "removals": [{"id": "r1"}]})
    )

    result = pipeline.load_pending_summaries(tmp_path)

    assert result == [
        {"channel": "kebire", "additions": [], "removals": [{"id": "r1"}]},
        {"channel": "weddings", "additions": [{"id": "a1"}], "removals": []},
    ]


def test_load_pending_summaries_empty_dir_returns_empty_list(tmp_path):
    assert pipeline.load_pending_summaries(tmp_path) == []


def test_load_pending_summaries_missing_dir_returns_empty_list(tmp_path):
    missing = tmp_path / "does-not-exist"
    assert pipeline.load_pending_summaries(missing) == []


def test_load_channel_display_names_deduplicates_shared_display_names(tmp_path):
    # fenkil/fenkil_diaspora are two curation sources for one Channel a
    # viewer sees as a single "Fenkil" row — callers that need to identify
    # a Channel (the viewership Worker's known-channel list, the weekly
    # export's grouping) must see "Fenkil" once, not both source keys.
    config_path = tmp_path / "channels.yaml"
    config_path.write_text(
        """
fenkil:
  type: search
  display_name: Fenkil
fenkil_diaspora:
  type: search
  display_name: Fenkil
kebire:
  type: channel
  display_name: Kebire
"""
    )
    assert pipeline.load_channel_display_names(config_path) == ["Fenkil", "Kebire"]


def test_matches_text_filter_in_title():
    assert pipeline.matches_text_filter("A trip across #Eritrea", "", "#eritrea") is True


def test_matches_text_filter_in_description_case_insensitive():
    assert (
        pipeline.matches_text_filter("Countryside ride", "Filmed in #ERITREA this summer", "#eritrea")
        is True
    )


def test_matches_text_filter_no_match():
    assert pipeline.matches_text_filter("A trip across Ethiopia", "no mention here", "#eritrea") is False


def test_matches_text_filter_empty_fields():
    assert pipeline.matches_text_filter("", "", "#eritrea") is False


def test_matches_text_filter_empty_filter_matches_everything():
    assert pipeline.matches_text_filter("anything at all", "", "") is True


def test_matches_text_filter_title_only_matches_in_title():
    assert pipeline.matches_text_filter_title_only("ERITREAN ORTHODOX NEW SBKET 2025", "", "sbket") is True


def test_matches_text_filter_title_only_ignores_description_matches():
    # Regression case: Anastasia's channel pastes the same cross-genre
    # hashtag boilerplate (including "#sbket") onto mezmur, podcast, and
    # other non-sermon video descriptions alike, so a description hit
    # alone must NOT count as a match — unlike matches_text_filter, which
    # would wrongly match this as "in description".
    assert (
        pipeline.matches_text_filter_title_only(
            "New Eritrean Orthodox Tewahdo Mezmur 2026", "...#mezmur #sbket #orthodox...", "sbket"
        )
        is False
    )


def test_matches_text_filter_title_only_case_insensitive():
    assert pipeline.matches_text_filter_title_only("eritrean orthodox new sbket 2025", "", "SBKET") is True


def test_matches_text_filter_title_only_empty_filter_matches_everything():
    assert pipeline.matches_text_filter_title_only("anything at all", "", "") is True


def test_candidate_matches_uses_title_and_description_by_default():
    entry = {"text_filter": "#eritrea"}
    assert pipeline.candidate_matches(entry, "Countryside ride", "Filmed in #ERITREA this summer") is True


def test_candidate_matches_restricts_to_title_when_flag_set():
    entry = {"text_filter": "sbket", "text_filter_title_only": True}
    assert (
        pipeline.candidate_matches(entry, "New Eritrean Orthodox Tewahdo Mezmur 2026", "...#sbket...")
        is False
    )


def test_candidate_matches_title_only_flag_still_matches_real_titles():
    entry = {"text_filter": "sbket", "text_filter_title_only": True}
    assert pipeline.candidate_matches(entry, "ERITREAN ORTHODOX NEW SBKET 2025 | ቀሲስ ዕርዶም", "") is True


def test_candidate_matches_rejects_the_real_off_topic_video_from_pr13s_bug():
    # Regression test for the bug reported against PR #13 ("Weekly curation
    # update"): this exact video was live in docs/data/videos.json under
    # source=independence_day_diaspora before this fix — it cleared
    # view_count_min/duration_min_sec with nothing checking whether it was
    # actually about Eritrea. discover.py's run_channel now runs every
    # type: search candidate through candidate_matches when channels.yaml
    # sets a text_filter (see channels.yaml's independence_day_diaspora).
    entry = {"text_filter": "eritrea"}
    assert (
        pipeline.candidate_matches(
            entry,
            "Did Isaias Afwerki Want a Confederation With Ethiopia? His Own Words From 1994",
            "",
        )
        is False
    )


def test_candidate_matches_keeps_genuine_diaspora_celebration_content():
    entry = {"text_filter": "eritrea"}
    assert (
        pipeline.candidate_matches(
            entry,
            "35TH ERITREAN INDEPENDENCE DAY CELEBRATION AT ERITREAN EMBASSY WASHINGTON DC",
            "",
        )
        is True
    )


def test_filter_candidates_by_text_filter_skips_fetch_when_no_text_filter_configured():
    entry = {"display_name": "Podcasters"}  # no text_filter, like channels.yaml's real podcasters entry

    def fetch_fn(ids, api_key):
        raise AssertionError("should not fetch metadata when entry has no text_filter")

    result = pipeline.filter_candidates_by_text_filter(["v1", "v2"], entry, "key", fetch_fn=fetch_fn)
    assert result == ["v1", "v2"]


def test_filter_candidates_by_text_filter_skips_fetch_for_empty_candidate_list():
    entry = {"text_filter": "eritrea"}

    def fetch_fn(ids, api_key):
        raise AssertionError("should not fetch metadata for an empty candidate list")

    assert pipeline.filter_candidates_by_text_filter([], entry, "key", fetch_fn=fetch_fn) == []


def test_text_filter_call_count_zero_when_no_text_filter_configured():
    assert pipeline.text_filter_call_count({}, ["a", "b"]) == 0


def test_text_filter_call_count_zero_for_empty_candidate_list():
    assert pipeline.text_filter_call_count({"text_filter": "eritrea"}, []) == 0


def test_text_filter_call_count_one_batch_for_a_small_candidate_list():
    assert pipeline.text_filter_call_count({"text_filter": "eritrea"}, ["a", "b"]) == 1


def test_text_filter_call_count_batches_over_fifty_candidates():
    assert pipeline.text_filter_call_count({"text_filter": "eritrea"}, [str(i) for i in range(55)]) == 2


def test_filter_candidates_by_text_filter_drops_non_matching_candidates():
    entry = {"text_filter": "eritrea"}

    def fetch_fn(ids, api_key):
        return {
            "good1": make_record(title="35th Eritrean Independence Day Celebration"),
            "bad1": make_record(title="Did Isaias Afwerki Want a Confederation With Ethiopia?"),
        }

    result = pipeline.filter_candidates_by_text_filter(["good1", "bad1"], entry, "key", fetch_fn=fetch_fn)
    assert result == ["good1"]


def test_filter_candidates_by_text_filter_drops_ids_missing_from_fetched_metadata():
    entry = {"text_filter": "eritrea"}

    def fetch_fn(ids, api_key):
        return {}  # API didn't return this ID at all

    assert pipeline.filter_candidates_by_text_filter(["gone1"], entry, "key", fetch_fn=fetch_fn) == []


def test_has_open_review_pr_true_when_prs_list_non_empty():
    assert pipeline.has_open_review_pr([{"number": 13}]) is True


def test_has_open_review_pr_false_when_prs_list_empty():
    assert pipeline.has_open_review_pr([]) is False


def test_count_batched_calls_zero_items_needs_zero_calls():
    assert pipeline.count_batched_calls(0, 50) == 0


def test_count_batched_calls_exact_multiple_of_batch_size():
    assert pipeline.count_batched_calls(100, 50) == 2


def test_count_batched_calls_rounds_up_for_a_remainder():
    assert pipeline.count_batched_calls(101, 50) == 3


def test_count_batched_calls_single_item():
    assert pipeline.count_batched_calls(1, 50) == 1


def test_classify_api_error_ok_when_no_status_code():
    assert pipeline.classify_api_error(None, {}) == "ok"


def test_classify_api_error_ok_for_a_successful_status():
    assert pipeline.classify_api_error(200, {}) == "ok"


def test_classify_api_error_quota_exceeded_legacy_shape():
    body = {
        "error": {
            "code": 403,
            "message": "The request cannot be completed because you have exceeded your quota.",
            "errors": [
                {
                    "message": "The request cannot be completed because you have exceeded your quota.",
                    "domain": "youtube.quota",
                    "reason": "quotaExceeded",
                }
            ],
        }
    }
    assert pipeline.classify_api_error(403, body) == "quota_exceeded"


def test_classify_api_error_daily_limit_exceeded_is_quota_exceeded():
    # search.list's own per-day call bucket (see API_UNIT_COSTS) reports
    # this reason instead of quotaExceeded when it's exhausted.
    body = {"error": {"errors": [{"reason": "dailyLimitExceeded", "domain": "usageLimits"}]}}
    assert pipeline.classify_api_error(403, body) == "quota_exceeded"


def test_classify_api_error_key_invalid_legacy_reason():
    body = {"error": {"errors": [{"reason": "keyInvalid", "domain": "usageLimits"}]}}
    assert pipeline.classify_api_error(400, body) == "key_invalid"


def test_classify_api_error_key_invalid_newer_error_detail_shape():
    body = {
        "error": {
            "code": 400,
            "message": "API key not valid. Please pass a valid API key.",
            "details": [{"reason": "API_KEY_INVALID", "domain": "googleapis.com"}],
        }
    }
    assert pipeline.classify_api_error(400, body) == "key_invalid"


def test_classify_api_error_key_invalid_falls_back_to_message_text():
    # Neither a recognized reason code nor domain — only the message says
    # it's a key problem. Google has changed this response's shape before.
    body = {"error": {"code": 400, "message": "API key not valid. Please pass a valid API key."}}
    assert pipeline.classify_api_error(400, body) == "key_invalid"


def test_classify_api_error_unrecognized_failure_is_unknown_error():
    body = {"error": {"code": 500, "message": "Internal error encountered."}}
    assert pipeline.classify_api_error(500, body) == "unknown_error"


def test_classify_api_error_accepts_unwrapped_error_object():
    # A caller may already have unwrapped the outer "error" key.
    body = {"errors": [{"reason": "quotaExceeded"}]}
    assert pipeline.classify_api_error(403, body) == "quota_exceeded"


def test_estimate_api_units_empty_call_counts():
    assert pipeline.estimate_api_units({}) == {"total_units": 0, "by_method": {}, "search_calls": 0}


def test_estimate_api_units_sums_shared_pool_methods_excluding_search():
    call_counts = {"videos.list": 3, "channels.list": 1, "playlistItems.list": 2, "search.list": 5}
    result = pipeline.estimate_api_units(call_counts)
    assert result == {
        "total_units": 6,  # 3 + 1 + 2 — search.list excluded, tracked separately below
        "by_method": {"videos.list": 3, "channels.list": 1, "playlistItems.list": 2, "search.list": 5},
        "search_calls": 5,
    }


def test_estimate_api_units_unrecognized_method_costs_nothing():
    result = pipeline.estimate_api_units({"some.future.method": 10})
    assert result == {"total_units": 0, "by_method": {"some.future.method": 0}, "search_calls": 0}


def test_merge_call_counts_adds_shared_keys_across_dicts():
    merged = pipeline.merge_call_counts({"videos.list": 2}, {"videos.list": 1, "search.list": 3})
    assert merged == {"videos.list": 3, "search.list": 3}


def test_merge_call_counts_no_dicts_is_empty():
    assert pipeline.merge_call_counts() == {}


def test_merge_call_counts_single_dict_is_unchanged():
    assert pipeline.merge_call_counts({"channels.list": 1}) == {"channels.list": 1}


def test_format_total_api_usage_summary_reports_units_and_search_calls():
    summary = pipeline.format_total_api_usage_summary({"videos.list": 3, "search.list": 2})
    assert summary == (
        "Total estimated API usage this run (all jobs): 3 unit(s) from the "
        "shared pool, 2 search.list call(s)."
    )


def test_format_total_api_usage_summary_handles_no_calls():
    # curate.yml's health-report step calls this even when preflight failed
    # and no .pending summaries exist at all.
    assert pipeline.format_total_api_usage_summary({}) == (
        "Total estimated API usage this run (all jobs): 0 unit(s) from the "
        "shared pool, 0 search.list call(s)."
    )
