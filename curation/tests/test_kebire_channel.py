import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from kebire_channel import matches_text_filter, tag_for


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
