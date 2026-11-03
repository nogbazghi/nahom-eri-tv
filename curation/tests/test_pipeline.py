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

    assert result == {"final_videos": [], "additions": [], "removals": []}


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
