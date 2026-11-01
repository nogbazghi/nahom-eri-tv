"""Unit tests for pipeline.py's shared pure helper functions.

Covers the logic consolidated out of discover.py and kebire_channel.py
(dropping already-stored/blocklisted candidate IDs, locating a channel's
stored videos by membership, extracting validate_record's rules subset
from a channels.yaml entry), write_channel_result, and the workflow-facing
load_pending_summaries. compute_run/validate_record are exercised
indirectly via discover.py/kebire_channel.py's own test suites and
end-to-end runs. No network calls — pipeline functions that hit the
YouTube API (fetch_video_metadata, compute_run with the real fetch_fn)
aren't exercised here.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pipeline  # noqa: E402


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


def test_videos_for_channel_returns_only_matching_videos():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Kebire"]},
            {"id": "2", "channels": ["Other Channel"]},
            {"id": "3", "channels": ["Kebire"]},
        ]
    }
    result = pipeline.videos_for_channel(existing_data, "Kebire")
    assert result == [
        {"id": "1", "channels": ["Kebire"]},
        {"id": "3", "channels": ["Kebire"]},
    ]


def test_write_channel_result_replaces_only_named_channels_videos():
    existing_data = {
        "videos": [
            {"id": "1", "channels": ["Kebire"]},
            {"id": "2", "channels": ["Other Channel"]},
        ],
        "schedules": {"Kebire": {"scheduleStart": "2026-01-01T00:00:00+00:00"}},
    }
    final_videos = [{"id": "3", "channels": ["Kebire"]}]

    result = pipeline.write_channel_result(
        existing_data, display_name="Kebire", final_videos=final_videos, is_default=False
    )

    assert result["videos"] == [
        {"id": "2", "channels": ["Other Channel"]},
        {"id": "3", "channels": ["Kebire"]},
    ]
    assert result["schedules"]["Kebire"]["scheduleStart"] == "2026-01-01T00:00:00+00:00"


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
