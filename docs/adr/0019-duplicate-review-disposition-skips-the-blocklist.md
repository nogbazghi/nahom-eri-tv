---
status: accepted
---

# A Curation candidate can be marked Duplicate, which skips the blocklist

The `(display_name, source)` dual-source pattern (ticket #16) deliberately lets two independent channel rules both discover the same underlying video id — e.g. Movies' `movies_hdmona` and `movies_search` rules both surfacing HDMONA NEBARIT's "Seb Mukan." Before this decision, a reviewer's only tool for dropping one of the two candidates was Reject, which writes a `blocklist.yaml` entry for that video id. `pipeline.py`'s revalidation pass checks every *currently stored* video against `blocked_ids` by bare id, with no `source` exception — so rejecting the redundant copy would, on the next scheduled run, also silently remove the other, already-approved copy of the same video.

Owner decision: a Review decision can also be Duplicate — removes just that one candidate from the Curation run's `videos.json`, requires no reason, and writes nothing to `blocklist.yaml`. Reject keeps its existing meaning unchanged (this video is bad, exclude it everywhere, forever); Duplicate means the video itself is fine, only this redundant discovery of it is being dropped.

## Considered Options

- **Leave Reject as the only disposition (status quo).** Rejected: confirmed live on PR #143 that this silently deletes an unrelated approved video on the next run whenever a reviewer rejects a same-id duplicate — a real data-loss bug, not a hypothetical one.
- **Stop blocklist.yaml-driven revalidation from matching across sources (scope `blocked_ids` by `(id, source)` instead of bare id).** Rejected: blocklist.yaml's whole purpose is excluding a video globally — a takedown request or miscategorized video doesn't stop being bad just because a second channel rule re-discovers it under a different source key. Narrowing the blocklist's scope would undermine that guarantee for every future blocklist entry, not just duplicate-handling.
- **A separate Duplicate disposition, scoped to just this run (chosen).** Keeps Reject's global, permanent, blocklist-backed meaning intact, and adds a narrower tool for the one case it doesn't fit: the same good video, discovered twice.
