"""Unit tests for discover.py's pure helper functions.

These test the logic discover.py adds on top of pipeline.py (which has its
own coverage, see test_pipeline.py) — the publishedAfter date window,
candidate dedup across multiple queries, and the search-query language/city
guess. No network calls; search_videos()/run_channel()/main() aren't
exercised here.
"""

import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import discover  # noqa: E402


def test_published_after_is_n_days_before_now():
    now = datetime.datetime(2026, 11, 15, 12, 0, 0, tzinfo=datetime.timezone.utc)
    result = discover.published_after(days=10, now=now)
    assert result == "2026-11-05T12:00:00Z"


def test_published_after_default_window_is_ten_days():
    now = datetime.datetime(2026, 1, 20, 0, 0, 0, tzinfo=datetime.timezone.utc)
    result = discover.published_after(now=now)
    assert result == "2026-01-10T00:00:00Z"


def test_dedup_candidates_preserves_first_seen_order_across_queries():
    result = discover.dedup_candidates([
        ["a", "b", "c"],
        ["b", "d", "a"],
    ])
    assert result == ["a", "b", "c", "d"]


def test_dedup_candidates_handles_empty_lists():
    assert discover.dedup_candidates([]) == []
    assert discover.dedup_candidates([[], []]) == []


def test_infer_language_city_matches_known_language():
    assert discover.infer_language_city("Tigrinya wedding") == ("Tigrinya", "")
    assert discover.infer_language_city("Eritrean wedding") == ("Eritrean", "")


def test_infer_language_city_returns_blank_when_unmatched():
    assert discover.infer_language_city("something else") == ("", "")
