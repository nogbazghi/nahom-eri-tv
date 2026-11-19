"""Unit tests for export_weekly_snapshot.py's pure snapshot-building logic
(iso_week_key, watch_count_key, build_snapshot) and fetch_all_counts against
a fake fetch_fn — no real Cloudflare API call, matching the Worker's own
test philosophy (worker/watch-counter.test.js) and this project's existing
pipeline.py pattern (ticket #116, part of #113).
"""

import datetime
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import export_weekly_snapshot as export  # noqa: E402


def test_iso_week_key_computes_the_iso_8601_week_for_a_date():
    assert export.iso_week_key(datetime.datetime(2026, 11, 18, tzinfo=datetime.timezone.utc)) == "2026-W47"
    assert export.iso_week_key(datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)) == "2026-W01"


def test_iso_week_key_a_late_december_date_can_belong_to_the_next_years_week_one():
    assert export.iso_week_key(datetime.datetime(2025, 12, 29, tzinfo=datetime.timezone.utc)) == "2026-W01"
    assert export.iso_week_key(datetime.datetime(2018, 12, 31, tzinfo=datetime.timezone.utc)) == "2019-W01"


def test_watch_count_key_matches_the_workers_key_shape():
    assert export.watch_count_key("weddings", "2026-W47") == "weddings:2026-W47"


KNOWN_CHANNELS = ["weddings", "comedy", "kebire"]


def test_build_snapshot_records_each_known_channels_count():
    snapshot = export.build_snapshot(
        {"weddings": 5, "comedy": 2, "kebire": 0},
        KNOWN_CHANNELS,
        "2026-W47",
        "2026-11-18T13:00:00+00:00",
    )
    assert snapshot == {
        "week": "2026-W47",
        "generated_at": "2026-11-18T13:00:00+00:00",
        "channels": {"comedy": 2, "kebire": 0, "weddings": 5},
    }


def test_build_snapshot_defaults_a_channel_absent_from_raw_counts_to_zero():
    # A channel with zero watches this week never got a KV key written at
    # all (see watch-counter.js's recordWatch) — it won't appear in
    # raw_counts, but it must still appear in the snapshot as 0.
    snapshot = export.build_snapshot({"weddings": 5}, KNOWN_CHANNELS, "2026-W47", "now")
    assert snapshot["channels"] == {"comedy": 0, "kebire": 0, "weddings": 5}


def test_build_snapshot_drops_a_channel_no_longer_in_known_channels():
    # A channel in raw_counts that isn't in known_channels (e.g. one
    # removed from channels.yaml since, or a stale KV key) must not leak
    # into the snapshot — it always reflects the current channel set.
    snapshot = export.build_snapshot(
        {"weddings": 5, "retired_channel": 99}, KNOWN_CHANNELS, "2026-W47", "now"
    )
    assert "retired_channel" not in snapshot["channels"]


def test_build_snapshot_orders_channels_alphabetically_for_a_stable_diff():
    snapshot = export.build_snapshot({}, ["kebire", "comedy", "weddings"], "2026-W47", "now")
    assert list(snapshot["channels"].keys()) == ["comedy", "kebire", "weddings"]


def fake_fetch_fn(seeded):
    """A fake fetch_fn stub — plays the role of the real, untested
    Cloudflare-API-backed fetch_channel_count, so fetch_all_counts's
    orchestration is testable without a real KV binding."""

    def fetch_fn(channel_id, week, *, account_id, namespace_id, api_token):
        return seeded.get((channel_id, week))

    return fetch_fn


def test_fetch_all_counts_reads_every_known_channels_count_for_the_given_week():
    fetch_fn = fake_fetch_fn({("weddings", "2026-W47"): 5, ("comedy", "2026-W47"): 2})
    counts = export.fetch_all_counts(
        KNOWN_CHANNELS,
        "2026-W47",
        account_id="acct",
        namespace_id="ns",
        api_token="tok",
        fetch_fn=fetch_fn,
    )
    assert counts == {"weddings": 5, "comedy": 2}


def test_fetch_all_counts_scopes_to_the_requested_week_only():
    fetch_fn = fake_fetch_fn({("weddings", "2026-W46"): 99, ("weddings", "2026-W47"): 5})
    counts = export.fetch_all_counts(
        KNOWN_CHANNELS,
        "2026-W47",
        account_id="acct",
        namespace_id="ns",
        api_token="tok",
        fetch_fn=fetch_fn,
    )
    assert counts == {"weddings": 5}


def test_seeded_kv_counts_produce_a_snapshot_file_with_each_channels_correct_count(tmp_path):
    # End-to-end against a fake KV stub (fetch_all_counts' fetch_fn) —
    # exercises ticket #116's acceptance criterion without a real
    # Cloudflare API call.
    fetch_fn = fake_fetch_fn({("weddings", "2026-W47"): 12, ("comedy", "2026-W47"): 3})
    raw_counts = export.fetch_all_counts(
        KNOWN_CHANNELS,
        "2026-W47",
        account_id="acct",
        namespace_id="ns",
        api_token="tok",
        fetch_fn=fetch_fn,
    )
    snapshot = export.build_snapshot(raw_counts, KNOWN_CHANNELS, "2026-W47", "2026-11-18T13:00:00+00:00")
    path = export.write_snapshot(snapshot, out_dir=tmp_path)

    assert path == tmp_path / "2026-W47.json"
    written = json.loads(path.read_text())
    assert written == {
        "week": "2026-W47",
        "generated_at": "2026-11-18T13:00:00+00:00",
        "channels": {"comedy": 3, "kebire": 0, "weddings": 12},
    }
