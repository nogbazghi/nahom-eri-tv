"""One-time migration: backfill the `source` field onto videos stored
before ticket 016 scoped write_channel_result/videos_for_channel by
(display_name, source) instead of display_name alone.

Every video already in docs/data/videos.json was added by exactly one
channels.yaml entry per display_name (Weddings <-> weddings, Kebire <->
kebire), so the backfill is a pure lookup from a video's existing
channels[0] to the one channels.yaml key whose display_name matches it —
no guessing, no network calls. A channel that later grows a second source
(e.g. Sports) will already have real source values on every video by then,
so this script never needs to run again.

Usage:
    python backfill_source.py             # from curation/
    python curation/backfill_source.py    # from the repo root
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import pipeline  # noqa: E402


def backfill_sources(data, channels_config):
    """Pure function — no I/O. Returns a new {"videos": [...], ...} dict
    (the input is left untouched) where every video missing a `source`
    field gets one set to whichever channels_config key's display_name
    matches that video's channels[0]. A video that already has a `source`,
    or whose channels[0] doesn't match any configured display_name, is
    copied through unchanged.
    """
    channel_key_by_display_name = {
        cfg["display_name"]: key for key, cfg in channels_config.items()
    }

    videos = []
    for video in data.get("videos", []):
        video = dict(video)
        if "source" not in video:
            display_names = video.get("channels") or []
            if display_names and display_names[0] in channel_key_by_display_name:
                video["source"] = channel_key_by_display_name[display_names[0]]
        videos.append(video)

    result = dict(data)
    result["videos"] = videos
    return result


def main():
    channels_config = pipeline.load_channels_config()
    data = pipeline.load_existing()
    updated = backfill_sources(data, channels_config)
    pipeline.write_output(updated)

    still_missing = [v["id"] for v in updated["videos"] if "source" not in v]
    if still_missing:
        print(f"Backfilled source on {len(updated['videos']) - len(still_missing)} videos; "
              f"{len(still_missing)} could not be matched to a channels.yaml entry: {still_missing}")
    else:
        print(f"Backfilled source on all {len(updated['videos'])} videos.")


if __name__ == "__main__":
    main()
