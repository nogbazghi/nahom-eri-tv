"""Unit tests for pipeline.py's shared pure helper functions.

Covers the logic consolidated out of discover.py and kebire_channel.py:
dropping already-stored/blocklisted candidate IDs, and locating a
channel's stored videos by membership. compute_run/validate_record are
exercised indirectly via discover.py/kebire_channel.py's own test suites
and end-to-end runs; this file is for the newly-shared helpers.
"""

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
