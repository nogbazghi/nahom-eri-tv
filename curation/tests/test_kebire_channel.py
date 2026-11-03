import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from kebire_channel import (
    candidate_matches,
    dedup_video_ids,
    matches_text_filter,
    matches_text_filter_title_only,
    resolve_playlist_id,
    tag_for,
)


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


def test_matches_text_filter_title_only_matches_in_title():
    assert matches_text_filter_title_only("ERITREAN ORTHODOX NEW SBKET 2025", "", "sbket") is True


def test_matches_text_filter_title_only_ignores_description_matches():
    # Regression case: Anastasia's channel pastes the same cross-genre
    # hashtag boilerplate (including "#sbket") onto mezmur, podcast, and
    # other non-sermon video descriptions alike, so a description hit
    # alone must NOT count as a match — unlike matches_text_filter, which
    # would wrongly match this as "in description".
    assert (
        matches_text_filter_title_only(
            "New Eritrean Orthodox Tewahdo Mezmur 2026", "...#mezmur #sbket #orthodox...", "sbket"
        )
        is False
    )


def test_matches_text_filter_title_only_case_insensitive():
    assert matches_text_filter_title_only("eritrean orthodox new sbket 2025", "", "SBKET") is True


def test_matches_text_filter_title_only_empty_filter_matches_everything():
    assert matches_text_filter_title_only("anything at all", "", "") is True


def test_candidate_matches_uses_title_and_description_by_default():
    entry = {"text_filter": "#eritrea"}
    assert candidate_matches(entry, "Countryside ride", "Filmed in #ERITREA this summer") is True


def test_candidate_matches_restricts_to_title_when_flag_set():
    entry = {"text_filter": "sbket", "text_filter_title_only": True}
    assert candidate_matches(entry, "New Eritrean Orthodox Tewahdo Mezmur 2026", "...#sbket...") is False


def test_candidate_matches_title_only_flag_still_matches_real_titles():
    entry = {"text_filter": "sbket", "text_filter_title_only": True}
    assert candidate_matches(entry, "ERITREAN ORTHODOX NEW SBKET 2025 | ቀሲስ ዕርዶም", "") is True


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


def test_dedup_video_ids_removes_repeats_preserving_first_seen_order():
    # A source playlist can itself list the same video more than once (e.g.
    # confirmed for real against Eri-TV's "Independence Day" playlist:
    # contentDetails.itemCount counts every entry, including repeats).
    assert dedup_video_ids(["a", "b", "a", "c", "b"]) == ["a", "b", "c"]


def test_dedup_video_ids_no_repeats_unchanged():
    assert dedup_video_ids(["a", "b", "c"]) == ["a", "b", "c"]


def test_dedup_video_ids_empty_list():
    assert dedup_video_ids([]) == []
