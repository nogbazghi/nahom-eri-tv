"""Unit tests for backfill_source.py's pure backfill helper.

One-time migration for ticket 016: before the pipeline scoped
write_channel_result/videos_for_channel by (display_name, source), stored
videos had no `source` field at all. Every pre-existing video was added by
exactly one channels.yaml entry per display_name, so the backfill is a pure
lookup — no network calls, no guessing.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import backfill_source  # noqa: E402

CHANNELS_CONFIG = {
    "weddings": {"type": "search", "display_name": "Weddings"},
    "kebire": {"type": "channel", "display_name": "Kebire"},
}


def test_backfill_sources_sets_source_from_the_matching_channels_yaml_key():
    data = {
        "videos": [
            {"id": "1", "channels": ["Weddings"]},
            {"id": "2", "channels": ["Kebire"]},
        ]
    }

    result = backfill_source.backfill_sources(data, CHANNELS_CONFIG)

    assert [v["source"] for v in result["videos"]] == ["weddings", "kebire"]


def test_backfill_sources_leaves_an_already_sourced_video_untouched():
    data = {"videos": [{"id": "1", "channels": ["Weddings"], "source": "weddings"}]}

    result = backfill_source.backfill_sources(data, CHANNELS_CONFIG)

    assert result["videos"][0]["source"] == "weddings"


def test_backfill_sources_does_not_mutate_the_input():
    data = {"videos": [{"id": "1", "channels": ["Weddings"]}]}

    backfill_source.backfill_sources(data, CHANNELS_CONFIG)

    assert "source" not in data["videos"][0]
