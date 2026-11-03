import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from kebire_channel import dedup_preserve_order, matches_text_filter, resolve_playlist_id, tag_for


def test_matches_text_filter_in_title():
    assert matches_text_filter("A trip across #Eritrea", "", "#eritrea") is True


def test_matches_text_filter_in_description_case_insensitive():
    assert matches_text_filter("Countryside ride", "Filmed in #ERITREA this summer", "#eritrea") is True


def test_matches_text_filter_no_match():
    assert matches_text_filter("A trip across Ethiopia", "no mention here", "#eritrea") is False


def test_matches_text_filter_empty_fields():
    assert matches_text_filter("", "", "#eritrea") is False


def test_matches_text_filter_empty_filter_matches_everything():
    assert matches_text_filter("anything at all", "", "") is True


def test_tag_for_strips_hash_and_lowercases():
    assert tag_for("#Eritrea") == "eritrea"


def test_tag_for_no_hash():
    assert tag_for("eritrea") == "eritrea"


def test_tag_for_empty():
    assert tag_for("") == ""


def test_resolve_playlist_id_uses_explicit_playlist_id_without_deriving_uploads():
    entry = {"channel_id": "UCz9a7XA9oMmk3CpFnE456bQ", "playlist_id": "PLnotarealplaylist"}

    def fail_if_called(channel_id, api_key):
        raise AssertionError("should not derive the uploads playlist when playlist_id is set")

    assert resolve_playlist_id(entry, "key", get_uploads_playlist_id=fail_if_called) == "PLnotarealplaylist"


def test_resolve_playlist_id_falls_back_to_uploads_playlist_when_unset():
    entry = {"channel_id": "UCz9a7XA9oMmk3CpFnE456bQ"}
    calls = []

    def fake_get_uploads_playlist_id(channel_id, api_key):
        calls.append((channel_id, api_key))
        return "UUz9a7XA9oMmk3CpFnE456bQ"

    result = resolve_playlist_id(entry, "key", get_uploads_playlist_id=fake_get_uploads_playlist_id)

    assert result == "UUz9a7XA9oMmk3CpFnE456bQ"
    assert calls == [("UCz9a7XA9oMmk3CpFnE456bQ", "key")]


def test_dedup_preserve_order_drops_repeats_but_keeps_first_occurrence_order():
    # A playlist can list the same video more than once (confirmed live for
    # Fenkil's big merged playlist: 206 playlistItems, 181 unique video
    # IDs) — without this, a repeated entry would flow through as two
    # separate "fresh" candidates and get added to videos.json twice.
    assert dedup_preserve_order(["a", "b", "a", "c", "b"]) == ["a", "b", "c"]


def test_dedup_preserve_order_empty_list():
    assert dedup_preserve_order([]) == []
