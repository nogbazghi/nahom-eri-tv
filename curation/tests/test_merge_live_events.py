"""Unit tests for merge_live_events.py's pure compute_live_events helper.

Covers ticket 085: parsing curation/live_events.yaml entries, applying the
documented lead-time/expiry defaults, respecting per-entry overrides, and
rejecting malformed entries (missing required fields, unparseable dates)
rather than silently writing them. No network calls — compute_live_events
is exercised with a fake fetch_fn, never the real fetch_video_metadata.
"""

import datetime
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import merge_live_events  # noqa: E402


def fake_fetch(video_ids, api_key):
    catalog = {
        "abc123": {
            "title": "Stockholm Wedding Live",
            "channel": "Organizer Channel",
            "description": "",
            "published": "2026-01-01",
            "duration": 0,
            "public": True,
            "embeddable": True,
            "view_count": 0,
        }
    }
    return {vid: catalog[vid] for vid in video_ids if vid in catalog}


def test_valid_entry_merges_with_default_lead_time_and_expiry():
    entries = [
        {
            "id": "abc123",
            "display_name": "Stockholm Wedding",
            "scheduled_start": "2026-12-01T18:00:00+00:00",
        }
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert errors == []
    assert live_events == [
        {
            "id": "abc123",
            "title": "Stockholm Wedding Live",
            "channel": "Organizer Channel",
            "displayName": "Stockholm Wedding",
            "scheduledStart": "2026-12-01T18:00:00+00:00",
            "leadTimeHours": 2,
            "expireAfterHours": 24,
        }
    ]


def test_overrides_are_respected_instead_of_defaults():
    entries = [
        {
            "id": "abc123",
            "display_name": "Multi-Day Festival",
            "scheduled_start": "2026-12-01T18:00:00+00:00",
            "lead_time_hours": 6,
            "expire_after_hours": 72,
        }
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert errors == []
    assert live_events[0]["leadTimeHours"] == 6
    assert live_events[0]["expireAfterHours"] == 72


def test_entry_missing_a_required_field_is_rejected_not_silently_written():
    entries = [
        {
            "id": "abc123",
            "scheduled_start": "2026-12-01T18:00:00+00:00",
            # display_name missing
        }
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert live_events == []
    assert len(errors) == 1
    assert "display_name" in errors[0]


def test_entry_with_unparseable_scheduled_start_is_rejected():
    entries = [
        {
            "id": "abc123",
            "display_name": "Stockholm Wedding",
            "scheduled_start": "not-a-date",
        }
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert live_events == []
    assert len(errors) == 1
    assert "not-a-date" in errors[0]


def test_valid_entries_still_merge_alongside_a_rejected_one():
    entries = [
        {
            "id": "abc123",
            "display_name": "Stockholm Wedding",
            "scheduled_start": "2026-12-01T18:00:00+00:00",
        },
        {
            "id": "missing-field",
            "scheduled_start": "2026-12-01T18:00:00+00:00",
        },
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert [e["id"] for e in live_events] == ["abc123"]
    assert len(errors) == 1


def test_an_unquoted_yaml_timestamp_is_coerced_to_a_json_serializable_string():
    # PyYAML's safe_load auto-parses an unquoted ISO-8601-looking scalar
    # into a real datetime object rather than a str — a maintainer could
    # easily submit live_events.yaml without quoting scheduled_start.
    # json.dump can't serialize a raw datetime, so this must come out as a
    # plain string rather than crash write_output at merge time.
    entries = [
        {
            "id": "abc123",
            "display_name": "Stockholm Wedding",
            "scheduled_start": datetime.datetime(2026, 12, 1, 18, 0, tzinfo=datetime.timezone.utc),
        }
    ]

    live_events, errors = merge_live_events.compute_live_events(
        entries, api_key="fake-key", fetch_fn=fake_fetch
    )

    assert errors == []
    assert isinstance(live_events[0]["scheduledStart"], str)
