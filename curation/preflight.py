"""Preflight check for the scheduled curation run (ticket #69).

Makes two cheap, dependency-free API calls before curate.yml runs
jobs.yaml's real, far more expensive jobs, and classifies any failure via
pipeline.classify_api_error — so a bad or quota-exhausted
YOUTUBE_API_KEY fails the whole run fast, with a clear message, instead
of burning part of a run's quota on jobs that were always going to fail
partway through.

Two calls, not one, because search.list draws from its own 100-call/day
bucket rather than the shared daily pool every other method draws from
(see pipeline.API_UNIT_COSTS' comment) — a key can have plenty of
shared-pool quota left while its search bucket is exhausted, and
discover.py would still fail partway through on its first search.list
call. i18nLanguages.list checks the shared pool; search.list (maxResults
0, to keep the response tiny) checks its own bucket.

Usage:
    export YOUTUBE_API_KEY=...
    python preflight.py             # from curation/
    python curation/preflight.py    # from the repo root
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pipeline  # noqa: E402

I18N_LANGUAGES_URL = "https://www.googleapis.com/youtube/v3/i18nLanguages"
SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

EXIT_MESSAGES = {
    "key_invalid": "YOUTUBE_API_KEY is invalid — check the secret before the next scheduled run.",
    "quota_exceeded": "YOUTUBE_API_KEY has no quota left today — the scheduled run will retry next time.",
    "unknown_error": "Preflight check to the YouTube Data API failed for an unrecognized reason — see the log above.",
}


def check_endpoint(url, params):
    """Make one preflight call to `url` with `params` and classify the
    result via pipeline.classify_api_error: "ok", "key_invalid",
    "quota_exceeded", or "unknown_error". HTTP/network handling lives
    here so classify_api_error itself stays pure."""
    request_url = f"{url}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(request_url) as response:
            response.read()
        return "ok"
    except urllib.error.HTTPError as e:
        try:
            body = json.load(e)
        except ValueError:
            body = {}
        return pipeline.classify_api_error(e.code, body)
    except urllib.error.URLError:
        return "unknown_error"


def check_api_key(api_key, url=I18N_LANGUAGES_URL):
    """Verify the key against the shared quota pool — i18nLanguages.list
    costs 1 unit and needs no business data."""
    return check_endpoint(url, {"part": "id", "key": api_key})


def check_search_quota(api_key, url=SEARCH_URL):
    """Verify search.list's own quota bucket separately — see this
    module's docstring for why check_api_key alone can't catch this."""
    return check_endpoint(url, {"part": "id", "q": "a", "maxResults": 0, "key": api_key})


def main():
    api_key = os.environ.get("YOUTUBE_API_KEY")
    if not api_key:
        sys.exit("Set YOUTUBE_API_KEY before running this script.")

    for verdict in (check_api_key(api_key), check_search_quota(api_key)):
        if verdict in EXIT_MESSAGES:
            sys.exit(EXIT_MESSAGES[verdict])

    print(
        "Preflight check passed: YOUTUBE_API_KEY is valid and has quota "
        "available (shared pool and search bucket)."
    )


if __name__ == "__main__":
    main()
