"""Shared search/validation/merge helpers for the curation pipeline.

Used by discover.py, kebire_channel.py, and fetch_metadata.py. This module
owns everything that's common across channel scripts: fetching video
metadata from the YouTube Data API, deciding whether a video still
qualifies for its channel (validate_record — a pure function, no API
calls), orchestrating a full per-channel run that re-checks both
already-stored videos and freshly-discovered candidates (compute_run),
merging the result into docs/data/videos.json (write_channel_result),
handing off a machine-readable summary of what changed to the GitHub
Actions workflow (write_run_summary), and reading those summaries back
for the workflow to act on (load_pending_summaries).

Design note: removals (a video failing validate_record) and additions
(a new video passing it) are kept as separate lists throughout, because
the workflow treats them differently — removals are safe to apply
immediately (same-day takedown response), additions go through a PR for a
quick human glance.
"""

import datetime
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CHANNELS_FILE = ROOT / "curation" / "channels.yaml"
JOBS_FILE = ROOT / "curation" / "jobs.yaml"
OUTPUT_FILE = ROOT / "docs" / "data" / "videos.json"
PENDING_DIR = ROOT / "curation" / ".pending"

API_URL = "https://www.googleapis.com/youtube/v3/videos"
DURATION_RE = re.compile(
    r"PT(?:(?P<hours>\d+)H)?(?:(?P<minutes>\d+)M)?(?:(?P<seconds>\d+)S)?"
)


def parse_duration(iso8601):
    if iso8601 == "P0D":
        # YouTube reports this (no "PT" time designator) for a livestream
        # that's still in progress — it has no real duration yet. Treat it
        # as 0 seconds so it naturally fails any duration_min_sec > 0
        # threshold until a later run sees its real duration.
        return 0
    match = DURATION_RE.fullmatch(iso8601)
    if not match:
        raise ValueError(f"Unrecognized duration format: {iso8601}")
    parts = match.groupdict(default="0")
    return int(parts["hours"]) * 3600 + int(parts["minutes"]) * 60 + int(parts["seconds"])


def load_yaml_list(path):
    path = Path(path)
    if not path.exists():
        return []
    with path.open() as f:
        return yaml.safe_load(f) or []


def load_channels_config(path=CHANNELS_FILE):
    """Parse channels.yaml, return {channel_key: {type, display_name, ...}}."""
    with Path(path).open() as f:
        return yaml.safe_load(f) or {}


def load_channel_display_names(path=CHANNELS_FILE):
    """The distinct set of Channel identifiers (display_name) a viewer
    actually sees and tunes to in the guide — sorted for a stable order.

    Several channels.yaml keys can share one display_name (e.g. `fenkil`
    and `fenkil_diaspora` both display as "Fenkil": one Channel row fed by
    two curation sources). Callers that need to identify a *Channel* rather
    than a curation source — the viewership Worker's known-channel list,
    the weekly export's per-channel grouping — must use this, not
    load_channels_config().keys(), or they'll double-count/fragment a
    single Channel's data across its source keys."""
    config = load_channels_config(path)
    return sorted({entry["display_name"] for entry in config.values()})


def load_jobs_list(path=JOBS_FILE):
    """Parse jobs.yaml, return the list of script filenames."""
    with Path(path).open() as f:
        return yaml.safe_load(f) or []


def load_existing():
    """Read docs/data/videos.json, or a fresh empty structure if it
    doesn't exist yet."""
    if OUTPUT_FILE.exists():
        with OUTPUT_FILE.open() as f:
            data = json.load(f)
        data.setdefault("videos", [])
        data.setdefault("schedules", {})
        return data
    return {"videos": [], "schedules": {}}


def write_output(data):
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_FILE.open("w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


def fetch_video_metadata(video_ids, api_key):
    """Batch-call videos.list for the given IDs (up to 50 per call).

    Returns a dict keyed by video ID: title, channel (channelTitle),
    description, published (YYYY-MM-DD), duration (seconds), public
    (status.privacyStatus == "public"), embeddable (status.embeddable),
    view_count (statistics.viewCount, 0 if missing/disabled). An ID the
    API doesn't return (deleted/never existed) is simply absent from the
    result — callers must treat a missing key as "gone".
    """
    results = {}
    video_ids = list(video_ids)
    for i in range(0, len(video_ids), 50):  # the API allows up to 50 IDs per call
        batch = video_ids[i : i + 50]
        if not batch:
            continue
        params = {
            "part": "snippet,contentDetails,status,statistics",
            "id": ",".join(batch),
            "key": api_key,
        }
        url = f"{API_URL}?{urllib.parse.urlencode(params)}"
        with urllib.request.urlopen(url) as response:
            payload = json.load(response)
        for item in payload.get("items", []):
            snippet = item.get("snippet", {})
            status = item.get("status", {})
            stats = item.get("statistics", {})
            results[item["id"]] = {
                "title": snippet.get("title", ""),
                "channel": snippet.get("channelTitle", ""),
                "description": snippet.get("description", ""),
                "published": snippet.get("publishedAt", "")[:10],
                "duration": parse_duration(item["contentDetails"]["duration"]),
                "public": status.get("privacyStatus") == "public",
                "embeddable": status.get("embeddable", False),
                "view_count": int(stats.get("viewCount", 0)),
            }
    return results


def filter_new_ids(candidate_ids, stored_ids, blocked_ids):
    """Drop candidate IDs already stored for this channel or on the
    blocklist. Pure — no API calls. Shared by discover.py (search-based
    candidates) and kebire_channel.py (a channel's own uploads)."""
    stored_set = set(stored_ids)
    return [cid for cid in candidate_ids if cid not in stored_set and cid not in blocked_ids]


def video_in_channel(video, *, display_name, source):
    """True if `video`'s channels field names exactly this one channel AND
    it was added by this channels.yaml rule (its `source` key). Scoping by
    both — not display_name alone — is what lets two separate rules (e.g.
    Sports' Eri-TV-playlist rule and its diaspora-player search rule) share
    one display_name without clobbering each other's videos."""
    return video.get("channels") == [display_name] and video.get("source") == source


def videos_for_channel(existing_data, *, display_name, source):
    """This rule's currently-stored videos — matching on channel membership
    AND source, so a display_name shared by multiple rules only yields the
    calling rule's own videos. Shared by discover.py/kebire_channel.py (to
    find what to re-validate) and write_channel_result (to find what to
    replace)."""
    return [
        v
        for v in existing_data.get("videos", [])
        if video_in_channel(v, display_name=display_name, source=source)
    ]


def matches_text_filter(title, description, text_filter):
    """Pure — case-insensitive substring match against title OR description.

    Relevance matching, not quality validation: this runs BEFORE
    validate_record, which knows nothing about text_filter. Shared by
    discover.py and kebire_channel.py — the only two scripts that admit
    candidates from an unvetted source (a search query, or a channel's
    whole upload history) where "is this actually about the right
    subject" needs an explicit check.
    """
    if not text_filter:
        return True
    needle = text_filter.lower()
    return needle in (title or "").lower() or needle in (description or "").lower()


def matches_text_filter_title_only(title, description, text_filter):
    """Pure — case-insensitive substring match against title ONLY.

    `description` is accepted (and ignored) to keep the same shape as
    matches_text_filter, so candidate_matches() can call either
    interchangeably. Use this for a source whose descriptions are
    unreliable for genre isolation — e.g. a creator who pastes the same
    cross-genre hashtag boilerplate (covering both the wanted series and
    unrelated content) onto most of their uploads' descriptions, making
    a description hit meaningless as a relevance signal.
    """
    if not text_filter:
        return True
    return text_filter.lower() in (title or "").lower()


def candidate_matches(entry, title, description):
    """Pure — whether a video satisfies a channels.yaml entry's
    text_filter, respecting that entry's `text_filter_title_only` flag.

    Defaults to matches_text_filter's title-OR-description behavior. Set
    `text_filter_title_only: true` on an entry to restrict matching to the
    title only, for a source where description-based matching produces
    false positives (see matches_text_filter_title_only's docstring). An
    entry with no `text_filter` configured matches everything, unchanged.
    """
    text_filter = entry.get("text_filter", "")
    matcher = matches_text_filter_title_only if entry.get("text_filter_title_only") else matches_text_filter
    return matcher(title, description, text_filter)


def filter_candidates_by_text_filter(candidate_ids, entry, api_key, fetch_fn=fetch_video_metadata):
    """Drop candidate IDs that fail `entry`'s text_filter (via
    candidate_matches). Shared by discover.py and kebire_channel.py — both
    need title/description to evaluate text_filter, which `compute_run`
    doesn't fetch until later, so this re-fetches metadata for the same
    IDs compute_run will fetch again internally. A small, acceptable
    duplication given how cheap videos.list batches are (kebire_channel.py
    established this tradeoff first; see its run_channel).

    Skips the fetch entirely (and returns candidate_ids unchanged) when
    `entry` has no text_filter configured — the common case — so a channel
    that doesn't need relevance filtering pays no extra API cost for it.

    `fetch_fn` is injectable for testing (defaults to the real
    fetch_video_metadata); callers in discover.py/kebire_channel.py should
    not pass it.
    """
    if not entry.get("text_filter") or not candidate_ids:
        return candidate_ids
    metadata = fetch_fn(candidate_ids, api_key)
    return [
        vid
        for vid in candidate_ids
        if vid in metadata and candidate_matches(entry, metadata[vid]["title"], metadata[vid]["description"])
    ]


def text_filter_call_count(entry, candidate_ids):
    """Pure. Number of videos.list batches filter_candidates_by_text_filter
    will actually make for `entry`/`candidate_ids` — mirrors that
    function's own guard (no text_filter configured, or no candidates, ->
    it skips the fetch entirely) so a caller can count this call without
    duplicating filter_candidates_by_text_filter's fetch itself."""
    if not entry.get("text_filter") or not candidate_ids:
        return 0
    return count_batched_calls(len(candidate_ids), 50)


def rules_from_config(cfg):
    """Extract the documented validate_record/compute_run rules subset
    (view_count_min, duration_min_sec) from a channels.yaml entry, ignoring
    every other key that entry may carry."""
    return {
        "view_count_min": cfg.get("view_count_min", 0),
        "duration_min_sec": cfg.get("duration_min_sec", 0),
    }


def validate_record(record, rules):
    """Pure function — no API calls, no I/O.

    `record` is one value from fetch_video_metadata()'s result (or the
    sentinel {"missing": True} if the ID wasn't returned at all). `rules`
    is one channel's channels.yaml entry (view_count_min, duration_min_sec).

    Returns (True, None) if the record passes every check, else
    (False, reason) with reason one of: "removed", "private",
    "not embeddable", "too short", "too few views". Check order matches
    that list.
    """
    if record.get("missing"):
        return False, "removed"
    if not record.get("public"):
        return False, "private"
    if not record.get("embeddable"):
        return False, "not embeddable"
    if record.get("duration", 0) < rules.get("duration_min_sec", 0):
        return False, "too short"
    if record.get("view_count", 0) < rules.get("view_count_min", 0):
        return False, "too few views"
    return True, None


def compute_run(
    *,
    channel_key,
    display_name,
    stored_videos,
    fresh_candidate_ids,
    rules,
    api_key,
    blocked_ids,
    fetch_fn=fetch_video_metadata,
):
    """Orchestrate one full channel run.

    1. Re-validate every video already in stored_videos: a blocklisted ID
       fails immediately (reason "blocklisted", no API call needed); every
       other ID gets fresh metadata and goes through validate_record. A
       video that still passes keeps its existing language/city/tags/
       channels/source/notes but refreshes title/channel/duration and
       stamps lastValidated = now (UTC ISO). One that fails goes into
       removals.
    2. Validate fresh_candidate_ids (skipping any already in
       stored_videos): a blocklisted candidate is dropped the same as a
       failing one — it never existed in the pool, so it's not a
       "removal". A candidate that passes becomes a new video record,
       tagged source=channel_key — the channels.yaml key of the rule that
       added it, distinct from display_name (front-end-facing membership)
       and from the record's own "channel" field (creator attribution).
    3. Return {"final_videos": [...], "additions": [...], "removals": [...],
       "api_calls": {"videos.list": n}} — api_calls counts the
       videos.list batches this call actually made (see
       count_batched_calls), for estimate_api_units to total up later.

    `fetch_fn` is injectable for testing (defaults to the real
    fetch_video_metadata); callers in discover.py/kebire_channel.py should
    not pass it.
    """
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    stored_ids = [v["id"] for v in stored_videos]
    ids_to_refetch = [vid for vid in stored_ids if vid not in blocked_ids]
    stored_metadata = fetch_fn(ids_to_refetch, api_key) if ids_to_refetch else {}

    kept_videos = []
    removals = []
    for v in stored_videos:
        vid = v["id"]
        if vid in blocked_ids:
            removals.append({"id": vid, "title": v.get("title", ""), "reason": "blocklisted"})
            continue
        record = stored_metadata.get(vid, {"missing": True})
        ok, reason = validate_record(record, rules)
        if ok:
            updated = dict(v)
            updated["title"] = record["title"]
            updated["channel"] = record["channel"]
            updated["duration"] = record["duration"]
            updated["lastValidated"] = now
            kept_videos.append(updated)
        else:
            removals.append({"id": vid, "title": v.get("title", ""), "reason": reason})

    stored_id_set = set(stored_ids)
    new_candidate_ids = [
        cid for cid in fresh_candidate_ids if cid not in stored_id_set and cid not in blocked_ids
    ]
    candidate_metadata = fetch_fn(new_candidate_ids, api_key) if new_candidate_ids else {}

    additions = []
    for cid in new_candidate_ids:
        record = candidate_metadata.get(cid, {"missing": True})
        ok, _reason = validate_record(record, rules)
        if not ok:
            continue  # dropped silently — never existed in the pool, not a removal
        additions.append(
            {
                "id": cid,
                "title": record["title"],
                "channel": record["channel"],
                "language": "",
                "city": "",
                "tags": [],
                "published": record["published"],
                "duration": record["duration"],
                "channels": [display_name],
                "source": channel_key,
                "notes": "",
                "lastValidated": now,
            }
        )

    videos_list_calls = count_batched_calls(len(ids_to_refetch), 50) + count_batched_calls(
        len(new_candidate_ids), 50
    )

    return {
        "final_videos": kept_videos + additions,
        "additions": additions,
        "removals": removals,
        "api_calls": {"videos.list": videos_list_calls},
    }


def write_channel_result(existing_data, *, display_name, source, final_videos, is_default):
    """Replace this rule's (display_name, source) slice of
    existing_data["videos"] with final_videos — every other video, including
    another rule's contribution to the same display_name, passes through
    untouched — and ensure existing_data["schedules"][display_name] exists.
    A channel's scheduleStart (and default flag) is set once, on first
    creation, and never modified on later runs — only the video list is
    refreshed. Unlike the old merge_channel(), this takes the final
    already-computed video list directly rather than fetching anything
    itself.
    """
    kept = [
        v
        for v in existing_data.get("videos", [])
        if not video_in_channel(v, display_name=display_name, source=source)
    ]
    kept.extend(final_videos)
    existing_data["videos"] = kept

    schedules = existing_data.setdefault("schedules", {})
    if display_name not in schedules:
        entry = {"scheduleStart": datetime.datetime.now(datetime.timezone.utc).isoformat()}
        if is_default:
            entry["default"] = True
        schedules[display_name] = entry
    # else: this channel's schedule entry already exists — leave its
    # scheduleStart and default value exactly as they are.

    return existing_data


def load_pending_summaries(pending_dir=PENDING_DIR):
    """Read every {"channel", "additions", "removals"} summary written by
    write_run_summary(), sorted by filename for deterministic ordering.

    Used by the GitHub Actions workflow to collect all channels' pending
    changes in one pass, rather than globbing curation/.pending/*.json
    inline in each workflow step.

    Returns [] if the directory doesn't exist or holds no .json files.
    """
    pending_dir = Path(pending_dir)
    if not pending_dir.exists():
        return []
    summaries = []
    for path in sorted(pending_dir.glob("*.json")):
        with path.open() as f:
            summaries.append(json.load(f))
    return summaries


# Confirmed against https://developers.google.com/youtube/v3/determine_quota_cost
# on 2026-11-19. Since the API's 2026-06-01 quota change, search.list draws
# from its own 100-call/day bucket rather than the shared daily pool every
# other method here draws from — both cost 1 unit per call today, but
# estimate_api_units keeps search.list's count out of total_units because
# it's checked against a different cap.
API_UNIT_COSTS = {
    "search.list": 1,
    "videos.list": 1,
    "playlistItems.list": 1,
    "channels.list": 1,
}

QUOTA_EXCEEDED_REASONS = {"quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"}
KEY_INVALID_REASONS = {"keyInvalid", "API_KEY_INVALID"}


def print_run_estimate(call_counts):
    """Print one human-readable line summarizing estimate_api_units(call_counts)
    for a script's run — shared by discover.py and kebire_channel.py so
    the message only needs updating in one place."""
    estimate = estimate_api_units(call_counts)
    print(
        f"Estimated API usage this run: {estimate['total_units']} unit(s) "
        f"from the shared pool, {estimate['search_calls']} search.list call(s)."
    )


def classify_api_error(status_code, error_body):
    """Pure — no network calls.

    Classifies a YouTube Data API response as "ok" (status_code < 400 or
    missing — nothing to classify), "quota_exceeded", "key_invalid", or
    "unknown_error" (a real failure that's neither of those two).

    `error_body` is the parsed JSON response body — either the whole
    body (with its outer "error" key) or that "error" object already
    unwrapped; both are accepted so a caller can pass json.load(response)
    directly. Matches both the legacy error shape (errors: [{"reason",
    "domain"}]) and the newer Google API error-detail shape (details:
    [{"reason": "API_KEY_INVALID"}]), falling back to the human-readable
    message for an invalid key — Google has changed this response's exact
    shape before (see ticket #69), and the preflight check feeding this
    needs to keep working across that kind of drift.
    """
    if status_code is None or status_code < 400:
        return "ok"

    error = error_body.get("error", error_body) if error_body else {}
    reasons = {e.get("reason", "") for e in error.get("errors", [])}
    reasons |= {d.get("reason", "") for d in error.get("details", [])}
    message = str(error.get("message", "")).lower()

    if reasons & QUOTA_EXCEEDED_REASONS:
        return "quota_exceeded"
    if reasons & KEY_INVALID_REASONS or "api key not valid" in message:
        return "key_invalid"
    return "unknown_error"


def count_batched_calls(item_count, batch_size):
    """Pure. Number of batch_size-at-a-time API calls needed to cover
    item_count items — 0 items needs 0 calls, not 1 (plain ceiling
    division would give 1). Shared by any call site that batches IDs into
    one call per `batch_size` items, e.g. fetch_video_metadata's
    videos.list (50 IDs per call)."""
    if item_count <= 0:
        return 0
    return -(-item_count // batch_size)


def merge_call_counts(*call_counts):
    """Pure. Sum any number of {method: count} dicts into one, adding
    counts for a method shared across dicts rather than overwriting it.
    Lets a channel script combine compute_run's api_calls with its own
    script-specific counts (search.list, channels.list,
    playlistItems.list, the text_filter step) into one dict for
    estimate_api_units."""
    merged = {}
    for counts in call_counts:
        for method, count in counts.items():
            merged[method] = merged.get(method, 0) + count
    return merged


def estimate_api_units(call_counts):
    """Pure — no network calls.

    `call_counts` maps a YouTube Data API method name (e.g.
    "videos.list") to how many times a run called it. Returns
    {"total_units": int, "by_method": {method: units}, "search_calls":
    int}: total_units is the cost against the shared daily pool
    (search.list excluded — see API_UNIT_COSTS' comment); search_calls is
    search.list's own call count, reported separately since it's checked
    against its own daily cap rather than the shared pool. An
    unrecognized method name costs 0 rather than raising, so a future
    call site doesn't have to special-case methods this table doesn't
    know about yet.
    """
    by_method = {method: count * API_UNIT_COSTS.get(method, 0) for method, count in call_counts.items()}
    total_units = sum(units for method, units in by_method.items() if method != "search.list")
    return {
        "total_units": total_units,
        "by_method": by_method,
        "search_calls": call_counts.get("search.list", 0),
    }


def has_open_review_pr(prs):
    """True if `prs` — the parsed JSON from `gh pr list --state open
    --json number` against the standing branch — is non-empty, i.e. a
    review is already in progress.

    Pure — takes the already-fetched PR list so the decision is testable
    without invoking `gh`. The GitHub Actions workflow uses this to
    decide whether to skip this run's branch update (queuing its
    additions for the following run) instead of force-pushing over a
    branch a reviewer is already working through.
    """
    return bool(prs)


def write_run_summary(channel_key, additions, removals, api_calls=None, out_dir="curation/.pending"):
    """Write {out_dir}/{channel_key}.json: {"channel", "additions",
    "removals"}, plus "api_calls" ({method: count}) when given — ticket
    #69's per-channel API usage, for estimate_api_units to total up
    across a run's .pending files (see load_pending_summaries).

    This directory is transient hand-off to the GitHub Actions workflow,
    not committed data — see .gitignore.
    """
    target_dir = PENDING_DIR if out_dir == "curation/.pending" else Path(out_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / f"{channel_key}.json"
    summary = {"channel": channel_key, "additions": additions, "removals": removals}
    if api_calls is not None:
        summary["api_calls"] = api_calls
    with path.open("w") as f:
        json.dump(summary, f, indent=2)
        f.write("\n")
