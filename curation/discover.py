"""Automated discovery for search-based channel lineups.

For each `type: search` entry in channels.yaml, searches YouTube for
recently-published videos matching each of its queries, re-validates both
those fresh candidates and the channel's already-stored videos (see
pipeline.compute_run — this is what fixes the old bug where a video could
silently disappear just because a search run didn't re-surface it, not
because it actually became invalid), and merges the result into
../docs/data/videos.json. Also writes a per-channel summary to
curation/.pending/<channel_key>.json for the GitHub Actions workflow.

Usage:
    export YOUTUBE_API_KEY=...
    python discover.py                  # from curation/
    python curation/discover.py         # from the repo root
"""

import datetime
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

# Make this importable/runnable from either the repo root or curation/
# itself.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pipeline  # noqa: E402

BLOCKLIST_FILE = Path(__file__).resolve().parent / "blocklist.yaml"

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
RESULTS_PER_QUERY = 25
PUBLISHED_WINDOW_DAYS = 10  # weekly cadence + buffer, so a missed run doesn't lose candidates


def published_after(days=PUBLISHED_WINDOW_DAYS, now=None):
    """RFC3339 timestamp `days` before `now` (defaults to current time), for
    search.list's publishedAfter param."""
    now = now or datetime.datetime.now(datetime.timezone.utc)
    cutoff = now - datetime.timedelta(days=days)
    return cutoff.strftime("%Y-%m-%dT%H:%M:%SZ")


def dedup_candidates(id_lists):
    """Flatten + dedup candidate IDs across multiple queries' result lists,
    preserving first-seen order. Pure — no API calls."""
    seen_set = set()
    seen = []
    for ids in id_lists:
        for vid in ids:
            if vid not in seen_set:
                seen_set.add(vid)
                seen.append(vid)
    return seen


def infer_language_city(query):
    """Best-effort language guess from the query string that found a video,
    per the "tag by the query" decision. Minor field — not exhaustive."""
    for candidate in ("Tigrinya", "Eritrean", "Tigre", "Arabic"):
        if candidate.lower() in query.lower():
            return candidate, ""
    return "", ""


def search_videos(query, api_key, published_after_ts):
    params = {
        "part": "id",
        "q": query,
        "type": "video",
        "maxResults": RESULTS_PER_QUERY,
        "publishedAfter": published_after_ts,
        "key": api_key,
    }
    url = f"{SEARCH_URL}?{urllib.parse.urlencode(params)}"
    with urllib.request.urlopen(url) as response:
        payload = json.load(response)
    return [item["id"]["videoId"] for item in payload.get("items", [])]


def run_channel(channel_key, cfg, api_key, blocked_ids, existing_data):
    display_name = cfg["display_name"]
    stored = pipeline.videos_for_channel(existing_data, display_name)
    stored_ids = [v["id"] for v in stored]

    after_ts = published_after()
    per_query_results = [search_videos(q, api_key, after_ts) for q in cfg["queries"]]
    candidates = dedup_candidates(per_query_results)
    candidates = pipeline.filter_new_ids(candidates, stored_ids, blocked_ids)

    rules = pipeline.rules_from_config(cfg)
    result = pipeline.compute_run(
        channel_key, display_name, stored, candidates, rules, api_key, blocked_ids
    )

    # Best-effort language/city/tags for new additions (minor field; see
    # infer_language_city docstring).
    query_by_candidate = {}
    for query, ids in zip(cfg["queries"], per_query_results):
        for vid in ids:
            query_by_candidate.setdefault(vid, query)
    for video in result["additions"]:
        query = query_by_candidate.get(video["id"], "")
        language, city = infer_language_city(query)
        video["language"] = language
        video["city"] = city
        video["tags"] = ["wedding"] if "wedding" in query.lower() else []

    return result


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    channels = pipeline.load_channels_config()
    blocked_ids = {entry["id"] for entry in pipeline.load_yaml_list(BLOCKLIST_FILE)}
    existing = pipeline.load_existing()

    search_channels = {k: v for k, v in channels.items() if v.get("type") == "search"}
    if not search_channels:
        print("No type: search channels in channels.yaml — nothing to do.")
        return

    for channel_key, cfg in search_channels.items():
        result = run_channel(channel_key, cfg, api_key, blocked_ids, existing)
        existing = pipeline.write_channel_result(
            existing, cfg["display_name"], result["final_videos"], cfg.get("is_default", False)
        )
        pipeline.write_run_summary(channel_key, result["additions"], result["removals"])
        print(
            f"{cfg['display_name']}: {len(result['additions'])} added, "
            f"{len(result['removals'])} removed, {len(result['final_videos'])} total"
        )

    pipeline.write_output(existing)


if __name__ == "__main__":
    main()
